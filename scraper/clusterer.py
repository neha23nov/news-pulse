import datetime
import json
import uuid
from datetime import timezone
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from db import get_connection

CUSTOM_STOP_WORDS = [
    "said", "says", "mr", "ms", "mrs", "dr", "also", "would", "could", "told",
    "one", "two", "three", "first", "last", "new", "news", "people", "year",
    "years", "time", "day", "week", "month", "today", "yesterday", "reuters",
    "bbc", "npr", "al", "jazeera", "guardian", "report", "reported", "according"
]

def preprocess_article_text(article):
    title = article["title"] or ""
    summary = article["summary"] or ""
    content = article["content"] or ""
    snippet = " ".join(content.split()[:150])
    weighted_text = f"{title} {title} {summary} {snippet}"
    return weighted_text.strip()

def extract_top_keywords(tfidf_matrix, feature_names, indices, top_n=4):
    if len(indices) == 0:
        return []
    sub_matrix = tfidf_matrix[indices]
    mean_scores = np.asarray(sub_matrix.mean(axis=0)).ravel()
    top_indices = mean_scores.argsort()[::-1][:top_n]
    keywords = [feature_names[i] for i in top_indices if mean_scores[i] > 0]
    return keywords

def generate_cluster_label(keywords, representative_title):
    if keywords:
        kw_str = ", ".join(w.title() for w in keywords[:3])
        if representative_title:
            short_title = representative_title[:60] + "..." if len(representative_title) > 60 else representative_title
            return f"{kw_str} - {short_title}"
        return kw_str
    if representative_title:
        return representative_title
    return "Untitled Cluster"

def group_articles_into_clusters(similarity_threshold=0.30):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, url, title, summary, content, published_at, source FROM articles ORDER BY published_at ASC")
    articles = [dict(row) for row in cursor.fetchall()]

    if not articles:
        conn.close()
        return 0

    if len(articles) == 1:
        art = articles[0]
        c_id = f"cluster_{uuid.uuid4().hex[:8]}"
        label = art["title"] or "Single Topic"
        now_iso = datetime.datetime.now(timezone.utc).isoformat()
        cursor.execute("DELETE FROM clusters")
        cursor.execute("""
            INSERT INTO clusters (id, label, keywords, representative_title, article_count, first_published_at, last_published_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (c_id, label, json.dumps([]), art["title"], 1, art["published_at"], art["published_at"], now_iso))
        cursor.execute("UPDATE articles SET cluster_id = ? WHERE id = ?", (c_id, art["id"]))
        conn.commit()
        conn.close()
        return 1

    corpus = [preprocess_article_text(a) for a in articles]
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=4000,
        ngram_range=(1, 2),
        min_df=1
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    feature_names = vectorizer.get_feature_names_out()

    distance_threshold = max(0.01, 1.0 - similarity_threshold)
    clustering_model = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=distance_threshold,
        metric="cosine",
        linkage="average"
    )
    cluster_labels = clustering_model.fit_predict(tfidf_matrix.toarray())

    clusters_map = {}
    for idx, cluster_label in enumerate(cluster_labels):
        clusters_map.setdefault(cluster_label, []).append(idx)

    now_iso = datetime.datetime.now(timezone.utc).isoformat()
    cursor.execute("DELETE FROM clusters")

    for raw_label, article_indices in clusters_map.items():
        c_id = f"cluster_{uuid.uuid4().hex[:8]}"
        cluster_articles = [articles[i] for i in article_indices]
        cluster_articles.sort(key=lambda x: x["published_at"])

        first_published = cluster_articles[0]["published_at"]
        last_published = cluster_articles[-1]["published_at"]
        count = len(cluster_articles)

        keywords = extract_top_keywords(tfidf_matrix, feature_names, article_indices, top_n=4)

        sub_matrix = tfidf_matrix[article_indices]
        centroid = np.asarray(sub_matrix.mean(axis=0))
        sims = cosine_similarity(sub_matrix, centroid).ravel()
        best_idx = int(sims.argmax())
        representative_title = cluster_articles[best_idx]["title"]

        display_label = generate_cluster_label(keywords, representative_title)

        cursor.execute("""
            INSERT INTO clusters (id, label, keywords, representative_title, article_count, first_published_at, last_published_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (c_id, display_label, json.dumps(keywords), representative_title, count, first_published, last_published, now_iso))

        for art in cluster_articles:
            cursor.execute("UPDATE articles SET cluster_id = ? WHERE id = ?", (c_id, art["id"]))

    conn.commit()
    conn.close()
    return len(clusters_map)
