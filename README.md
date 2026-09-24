# News Pulse — Topic-Clustered News Timeline

News Pulse is a full-stack news intelligence system that ingests live articles from multiple major news RSS feeds, normalizes schema inconsistencies, extracts article body text, groups related coverage into coherent topic clusters using TF-IDF and cosine similarity, serves the clustered data through a Node.js REST API with asynchronous pipeline triggering, and visualizes story lifecycles on an interactive Next.js timeline.

---

## Repository Structure

```
news-pulse/
├── scraper/              # Python RSS ingestion, normalization, and NLP topic clustering
│   ├── clusterer.py      # TF-IDF vectorization & agglomerative topic clustering
│   ├── db.py             # SQLite database models & schema initialization
│   ├── fetcher.py        # Multi-feed RSS ingestion, HTML sanitization, full-text extraction
│   ├── main.py           # Pipeline runner CLI
│   └── requirements.txt  # Python dependencies
├── backend/              # Node.js REST API
│   ├── db.js             # Database connector
│   ├── server.js         # Express REST API endpoints & async job runner
│   ├── package.json      # Node.js dependencies & scripts
│   └── .env.example      # Backend environment variable template
├── frontend/             # Next.js & React interactive dashboard
│   ├── components/       # Timeline visualizer, source filter, modals, card explorer
│   ├── lib/              # API client methods
│   ├── pages/            # Next.js pages
│   ├── types/            # TypeScript interfaces
│   └── package.json      # Frontend dependencies & build configuration
├── data/                 # Shared SQLite database storage (newspulse.db)
└── README.md             # Project documentation
```

## Architecture Overview

```
[BBC News / NPR / Al Jazeera / The Guardian]
                   │
                   ▼ (RSS XML)
       [Python Ingestion Pipeline]
                   │
                   ├─► Schema normalization & date sanitization
                   ├─► Full body extraction via Trafilatura / BeautifulSoup
                   ├─► Duplicate prevention via canonical URL hashing
                   ▼
         [SQLite / Database]
                   │
                   ▼
       [NLP Topic Clustering]
                   │
                   ├─► Preprocessing & weighted text representation
                   ├─► TF-IDF feature extraction (n-grams 1-2)
                   ├─► Cosine distance & agglomerative clustering
                   ├─► Keyword & representative headline labeling
                   ▼
         [SQLite / Database]
                   │
                   ▼
         [Node.js REST API]
         (Express / Subprocess Manager)
          ├── GET  /clusters
          ├── GET  /clusters/:id
          ├── GET  /timeline
          ├── POST /ingest/trigger
          └── GET  /ingest/status/:jobId
                   │
                   ▼ (REST JSON)
       [Next.js React Frontend]
          ├── Time-axis visualizer (active duration windows)
          ├── Source filter & search query filters
          ├── Cluster detail modal with chronological articles
          └── Live refresh polling & auto-refresh
```
