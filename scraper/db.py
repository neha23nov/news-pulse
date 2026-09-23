import os
import sqlite3
from pathlib import Path

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "newspulse.db"

def get_db_path():
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        return Path(env_path)
    return DEFAULT_DB_PATH

def get_connection():
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        content TEXT,
        published_at TEXT NOT NULL,
        source TEXT NOT NULL,
        cluster_id TEXT,
        created_at TEXT NOT NULL
    );
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS clusters (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        keywords TEXT NOT NULL,
        representative_title TEXT,
        article_count INTEGER NOT NULL DEFAULT 0,
        first_published_at TEXT NOT NULL,
        last_published_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_cluster_id ON articles(cluster_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);")
    conn.commit()
    conn.close()
