# News Pulse — 2.5-Minute Video Walkthrough Script

Use this script for your screen recording (via Loom, OBS, or screen recorder).
Target length: **2 to 3 minutes**.

---

## Preparation Before Hitting Record
1. Open your browser with the frontend running at `http://localhost:3000` (or your deployed URL).
2. Open your code editor with `scraper/fetcher.py` and `scraper/clusterer.py` ready in tabs.
3. Make sure the database has fresh articles ingested.

---

## Section 1: Live Timeline Demo (30–45 seconds)

**[Screen: Browser showing the News Pulse Timeline at http://localhost:3000]**

**Spoken Script:**
> "Hello everyone! This is my submission for the News Pulse take-home assessment.
> 
> News Pulse pulls live articles from four major news outlets — BBC News, NPR, Al Jazeera, and The Guardian — and groups them into topic clusters plotted along this visual timeline.
> 
> As you can see, each horizontal bar represents a distinct real-world news event. The start and end of each bar show exactly when the story was active, based on the earliest and latest published articles.
> 
> Notice how the bar sizes adapt: topics with more coverage are highlighted with bolder cards and badge counts. For example, here is a story covering the Sri Lanka Easter bombing court rulings, spanning across multiple hours with cross-source coverage.
> 
> When I click on any cluster, a detailed modal opens showing the chronological timeline of all published articles, complete with publisher badges, publication timestamps, summaries, and links to the original articles.
> 
> We can also filter in real-time by news source, search by keyword, or hit 'Refresh Data' to asynchronously trigger our background scraping pipeline and poll for new updates."

---

## Section 2: How Topic Grouping Works (45–60 seconds)

**[Screen: Switch to VS Code, show `scraper/clusterer.py`]**

**Spoken Script:**
> "Now let's look at how the topic grouping works under the hood.
> 
> In `scraper/fetcher.py`, we ingest RSS feeds, normalize inconsistent dates into standard ISO 8601 UTC timestamps, and extract the full article body text using Trafilatura with a BeautifulSoup fallback.
> 
> For topic grouping in `scraper/clusterer.py`, I implemented a TF-IDF vectorization and agglomerative clustering approach:
> 
> First, each article's text is preprocessed by combining its headline with double weight, its summary, and opening paragraphs, while stripping common journalistic filler words like 'said', 'reported', and 'news'.
> 
> Next, scikit-learn computes TF-IDF vectors with 1-to-2 n-grams. Instead of rigid k-means where you must guess the number of clusters in advance, we use hierarchical Agglomerative Clustering with average linkage and cosine distance.
> 
> Average linkage ensures that all articles grouped together maintain high mutual semantic similarity, preventing runaway chaining.
> 
> Finally, we auto-label each cluster by extracting the top TF-IDF keywords and finding the headline closest to the cluster's centroid."

---

## Section 3: One Hard Problem & How I Solved It (30–45 seconds)

**[Screen: Show `scraper/clusterer.py` around threshold calculation, or switch back to the browser]**

**Spoken Script:**
> "One hard problem I ran into was deciding what counts as 'related' across different newsrooms without over-clustering or under-clustering.
> 
> Different outlets often report the same breaking story using different vocabulary — for instance, one outlet calling an event a 'storm' while another calls it 'Hurricane Polo'.
> 
> If the cosine similarity threshold was set too strict, say 0.45, reports on the exact same event ended up in separate clusters. But if it was set too loose, say below 0.20, unrelated political news would falsely merge.
> 
> I solved this by:
> 1. Double-weighting the headlines relative to body snippets.
> 2. Experimenting systematically to find the optimal threshold of 0.30 cosine similarity with average linkage, which cleanly groups cross-source stories while isolating distinct events."

---

## Section 4: What I Would Improve With More Time (15–20 seconds)

**[Screen: Browser timeline view]**

**Spoken Script:**
> "With more time, I would implement streaming incremental clustering using pre-trained sentence transformer embeddings. This would allow new articles to be assigned to existing clusters in real-time without recomputing the entire corpus matrix, as well as cross-lingual story tracking across non-English feeds.
> 
> Thank you for reviewing my project!"
