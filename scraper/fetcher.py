import datetime
import html
import re
import urllib.parse
import warnings
from datetime import timezone
import dateutil.parser
import feedparser
import requests
import trafilatura
from bs4 import BeautifulSoup, MarkupResemblesLocatorWarning
from db import get_connection

warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)

FEEDS = [
    {
        "name": "BBC News",
        "url": "https://feeds.bbci.co.uk/news/rss.xml"
    },
    {
        "name": "NPR",
        "url": "https://feeds.npr.org/1001/rss.xml"
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml"
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com/world/rss"
    }
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def clean_html(raw_html):
    if not raw_html:
        return ""
    if "<" not in raw_html and ">" not in raw_html:
        return html.unescape(raw_html.strip())
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    return html.unescape(text)

def parse_date(entry):
    for attr in ("published", "pubDate", "updated", "created"):
        val = getattr(entry, attr, None) or entry.get(attr)
        if val:
            try:
                dt = dateutil.parser.parse(val)
                if not dt.tzinfo:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.astimezone(timezone.utc).isoformat()
            except Exception:
                pass
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            dt = datetime.datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            pass
    return datetime.datetime.now(timezone.utc).isoformat()

def extract_full_text(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            extracted = trafilatura.extract(downloaded, include_links=False, include_images=False)
            if extracted and len(extracted.strip()) > 50:
                return extracted.strip()
    except Exception:
        pass
    try:
        resp = requests.get(url, headers=HEADERS, timeout=6)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.content, "html.parser")
            for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
                tag.decompose()
            paragraphs = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 25]
            if paragraphs:
                return "\n\n".join(paragraphs)
    except Exception:
        pass
    return ""

def canonicalize_url(url):
    if not url:
        return ""
    parsed = urllib.parse.urlparse(url)
    clean = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))
    return clean.rstrip("/")

def get_existing_urls():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT url FROM articles")
    rows = cursor.fetchall()
    conn.close()
    return {r["url"] for r in rows}

def fetch_and_save_articles():
    conn = get_connection()
    cursor = conn.cursor()
    existing_urls = get_existing_urls()
    new_articles_count = 0

    for feed_info in FEEDS:
        feed_name = feed_info["name"]
        feed_url = feed_info["url"]
        try:
            parsed_feed = feedparser.parse(feed_url)
            for entry in parsed_feed.entries:
                raw_url = getattr(entry, "link", None) or entry.get("link", "")
                url = canonicalize_url(raw_url)
                if not url or url in existing_urls:
                    continue

                raw_title = getattr(entry, "title", None) or entry.get("title", "")
                title = clean_html(raw_title)
                if not title:
                    continue

                raw_summary = (
                    getattr(entry, "summary", None)
                    or entry.get("summary")
                    or getattr(entry, "description", None)
                    or entry.get("description")
                    or ""
                )
                summary = clean_html(raw_summary)

                published_at = parse_date(entry)
                content = extract_full_text(url)
                if not content:
                    content = summary

                now_iso = datetime.datetime.now(timezone.utc).isoformat()
                cursor.execute("""
                    INSERT INTO articles (url, title, summary, content, published_at, source, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (url, title, summary, content, published_at, feed_name, now_iso))
                conn.commit()

                existing_urls.add(url)
                new_articles_count += 1
        except Exception:
            continue

    conn.close()
    return new_articles_count
