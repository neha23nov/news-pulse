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

---

## Live Demo & Video Walkthrough

- **Live Frontend**: `[Insert deployed Vercel/Netlify URL]`
- **Live Backend API**: `[Insert deployed Render/Railway URL]`
- **Video Walkthrough (2–3 mins)**: `[Insert Loom / YouTube unlisted link]`

---

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

---

## News Sources Used

Articles are pulled live from four reputable international news outlets:

1. **BBC News** — `https://feeds.bbci.co.uk/news/rss.xml`
2. **NPR** — `https://feeds.npr.org/1001/rss.xml`
3. **Al Jazeera** — `https://www.aljazeera.com/xml/rss/all.xml`
4. **The Guardian** — `https://www.theguardian.com/world/rss`

### Ingestion Robustness
- **Format Inconsistencies**: Automatically falls back between `<description>`, `<summary>`, and `<content:encoded>` tags.
- **Date Normalization**: Standardizes diverse time formats (RFC 822, ISO 8601, timezone offsets) into ISO 8601 UTC strings (`YYYY-MM-DDTHH:MM:SSZ`).
- **Full Content Extraction**: Pulls full article text using Trafilatura with HTTP fallback to BeautifulSoup paragraph scraping.
- **Duplicate Prevention & Re-runnability**: Canonicalizes URLs and filters out existing URLs before scraping bodies, avoiding repeated work across recurring scraper runs.

---

## Topic-Grouping Methodology

### Approach Used: TF-IDF with Cosine Distance Agglomerative Clustering
Rather than basic keyword overlap or rigid KMeans, News Pulse employs TF-IDF vectorization paired with hierarchical Agglomerative Clustering:

1. **Text Representation**: Concatenates headline (weighted double), article summary, and the opening 150 words of body content to capture both editorial focus and contextual detail.
2. **Feature Extraction**: Computes TF-IDF matrices with sublinear term frequency, English stop-word filtering, and custom journalistic noise filtering (`said`, `reports`, `breaking`, `news`).
3. **Clustering Algorithm**: Uses `AgglomerativeClustering` with average linkage and cosine distance. Average linkage prevents the runaway "chaining" effect seen in single-linkage DBSCAN while allowing arbitrary cluster counts.
4. **Threshold Selection**: A cosine similarity threshold of `0.30` (`distance_threshold = 0.70`) was selected through empirical validation:
   - Values above `0.45` were too strict, causing stories on the same event from different outlets to fragment into separate clusters.
   - Values below `0.20` grouped loosely related international politics or sports stories together.
   - `0.30` reliably groups the same real-world event across BBC, NPR, Al Jazeera, and The Guardian while keeping distinct stories separate.
5. **Cluster Labeling**: 
   - Computes top TF-IDF n-grams for the cluster.
   - Identifies the cluster centroid and selects the headline closest to the centroid as the representative title.
   - Computes the temporal envelope (`first_published_at` and `last_published_at`) to represent the story's active lifespan.

### Limitations Noticed
- **Vocabulary Divergence**: Outlets occasionally report the same event using entirely distinct phrasing or localized naming conventions before canonical names emerge, which can momentarily keep them in separate clusters until follow-up reports bridge the vocabulary.
- **Story Evolution Across Days**: A fast-moving event that evolves over several days can undergo semantic drift, where initial breaking reports have lower term overlap with analytical reports published 48 hours later.

---

## REST API Specification

| Endpoint | Method | Description |
|---|---|---|
| `/clusters` | `GET` | Returns list of topic clusters with labels, article counts, time range, and participating sources. Supports `?source=` query parameter. |
| `/clusters/:id` | `GET` | Returns complete cluster details and all member articles sorted chronologically (`published_at ASC`). |
| `/timeline` | `GET` | Returns clusters formatted for time-axis plotting: `startTimestamp`, `endTimestamp`, `durationHours`, `intensity`, and `sources`. |
| `/sources` | `GET` | Returns list of distinct news sources and total article count per source. |
| `/ingest/trigger` | `POST` | Asynchronously spawns the Python scraper pipeline and returns a unique `jobId`. |
| `/ingest/status/:jobId` | `GET` | Returns status (`running`, `completed`, `failed`), execution timestamps, and ingestion summary metrics. |

---

## Setup & Local Development

### Prerequisites
- Node.js >= 18.x (Node 22 recommended)
- Python >= 3.10
- npm >= 9.x

### 1. Scraper Setup
```bash
cd scraper
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

### 2. Backend Setup
```bash
cd ../backend
npm install
cp .env.example .env
npm start
```
The backend API starts on `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
npm start
```
The frontend application starts on `http://localhost:3000`.

---

## Deployment Guide

### Frontend (Vercel)
- Deploy the `/frontend` directory to Vercel.
- Configure environment variable:
  - `NEXT_PUBLIC_API_URL`: URL of your deployed backend (e.g. `https://news-pulse-api.onrender.com`).

### Backend (Render / Railway)
- Deploy the repository with root directory set to `/backend` or use a Docker container combining Node.js and Python.
- Set environment variables:
  - `PORT`: `4000` (or assigned by host)
  - `DATABASE_PATH`: path to persistent volume or SQLite database file
  - `PYTHON_PATH`: `python` or `python3`

### Scheduled Scrapes
- The ingestion pipeline can be scheduled via GitHub Actions cron, a scheduled worker on Render, or triggered on-demand via the frontend "Refresh Data" button.

---


