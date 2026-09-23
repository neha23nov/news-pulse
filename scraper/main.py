import argparse
import json
import sys
from clusterer import group_articles_into_clusters
from db import init_db
from fetcher import fetch_and_save_articles

def main():
    parser = argparse.ArgumentParser(description="News Pulse RSS Ingestion and Topic Clustering Pipeline")
    parser.add_argument("--similarity-threshold", type=float, default=0.32)
    parser.add_argument("--cluster-only", action="store_true")
    args = parser.parse_args()

    init_db()

    new_articles = 0
    if not args.cluster_only:
        new_articles = fetch_and_save_articles()

    cluster_count = group_articles_into_clusters(similarity_threshold=args.similarity_threshold)

    result = {
        "status": "success",
        "new_articles_ingested": new_articles,
        "total_clusters_generated": cluster_count
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
