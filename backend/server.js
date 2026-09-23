require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const { getDb, dbPath } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const SCRAPER_DIR = path.resolve(__dirname, '..', 'scraper');
const SCRAPER_SCRIPT = path.join(SCRAPER_DIR, 'main.py');

app.use(cors());
app.use(express.json());

const jobs = new Map();

app.get('/clusters', (req, res, next) => {
  try {
    const { source } = req.query;
    const db = getDb();
    let query = `
      SELECT 
        c.id,
        c.label,
        c.keywords,
        c.representative_title,
        c.article_count,
        c.first_published_at,
        c.last_published_at,
        c.updated_at,
        GROUP_CONCAT(DISTINCT a.source) as sources_str
      FROM clusters c
      JOIN articles a ON a.cluster_id = c.id
    `;
    const params = [];
    if (source) {
      query += ` WHERE a.source = ?`;
      params.push(source);
    }
    query += ` GROUP BY c.id ORDER BY c.last_published_at DESC`;

    const rows = db.prepare(query).all(...params);
    const clusters = rows.map(r => {
      let kw = [];
      try {
        kw = JSON.parse(r.keywords);
      } catch (e) {
        kw = [];
      }
      return {
        id: r.id,
        label: r.label,
        keywords: kw,
        representativeTitle: r.representative_title,
        articleCount: r.article_count,
        timeRange: {
          earliest: r.first_published_at,
          latest: r.last_published_at
        },
        sources: r.sources_str ? r.sources_str.split(',') : [],
        updatedAt: r.updated_at
      };
    });

    res.json({
      total: clusters.length,
      clusters
    });
  } catch (err) {
    next(err);
  }
});

app.get('/clusters/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Valid cluster ID is required' });
    }

    const db = getDb();
    const clusterRow = db.prepare(`SELECT * FROM clusters WHERE id = ?`).get(id);

    if (!clusterRow) {
      return res.status(404).json({ error: `Cluster with ID "${id}" was not found` });
    }

    const articleRows = db.prepare(`
      SELECT id, url, title, summary, content, published_at, source, created_at
      FROM articles
      WHERE cluster_id = ?
      ORDER BY published_at ASC
    `).all(id);

    let keywords = [];
    try {
      keywords = JSON.parse(clusterRow.keywords);
    } catch (e) {
      keywords = [];
    }

    res.json({
      id: clusterRow.id,
      label: clusterRow.label,
      keywords,
      representativeTitle: clusterRow.representative_title,
      articleCount: clusterRow.article_count,
      timeRange: {
        earliest: clusterRow.first_published_at,
        latest: clusterRow.last_published_at
      },
      updatedAt: clusterRow.updated_at,
      articles: articleRows.map(a => ({
        id: a.id,
        url: a.url,
        title: a.title,
        summary: a.summary,
        snippet: a.content ? a.content.slice(0, 300) : '',
        publishedAt: a.published_at,
        source: a.source,
        createdAt: a.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

app.get('/timeline', (req, res, next) => {
  try {
    const { source } = req.query;
    const db = getDb();
    let query = `
      SELECT 
        c.id,
        c.label,
        c.keywords,
        c.representative_title,
        c.article_count,
        c.first_published_at,
        c.last_published_at,
        GROUP_CONCAT(DISTINCT a.source) as sources_str
      FROM clusters c
      JOIN articles a ON a.cluster_id = c.id
    `;
    const params = [];
    if (source) {
      query += ` WHERE a.source = ?`;
      params.push(source);
    }
    query += ` GROUP BY c.id ORDER BY c.first_published_at ASC`;

    const rows = db.prepare(query).all(...params);

    const timelineData = rows.map(r => {
      let kw = [];
      try {
        kw = JSON.parse(r.keywords);
      } catch (e) {
        kw = [];
      }
      const startMs = new Date(r.first_published_at).getTime();
      const endMs = new Date(r.last_published_at).getTime();
      const durationHours = Math.max(0.5, Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 10) / 10);
      const intensity = Math.min(10, Math.max(1, r.article_count * 2));
      const sources = r.sources_str ? r.sources_str.split(',') : [];

      return {
        id: r.id,
        label: r.label,
        representativeTitle: r.representative_title,
        keywords: kw,
        articleCount: r.article_count,
        startTime: r.first_published_at,
        endTime: r.last_published_at,
        startTimestamp: startMs,
        endTimestamp: endMs,
        durationHours,
        intensity,
        sources
      };
    });

    res.json({
      count: timelineData.length,
      timeline: timelineData
    });
  } catch (err) {
    next(err);
  }
});

app.get('/sources', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT source, count(*) as article_count 
      FROM articles 
      GROUP BY source 
      ORDER BY article_count DESC
    `).all();
    res.json({ sources: rows });
  } catch (err) {
    next(err);
  }
});

app.post('/ingest/trigger', (req, res, next) => {
  try {
    const jobId = uuidv4();
    const job = {
      jobId,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      result: null,
      error: null
    };
    jobs.set(jobId, job);

    const child = spawn(PYTHON_PATH, [SCRAPER_SCRIPT], {
      cwd: SCRAPER_DIR,
      env: { ...process.env, DATABASE_PATH: dbPath }
    });

    let stdoutData = '';
    let stderrData = '';

    child.stdout.on('data', chunk => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderrData += chunk.toString();
    });

    child.on('close', code => {
      job.completedAt = new Date().toISOString();
      if (code === 0) {
        job.status = 'completed';
        try {
          const lines = stdoutData.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          job.result = JSON.parse(lastLine);
        } catch (e) {
          job.result = { rawOutput: stdoutData.trim() };
        }
      } else {
        job.status = 'failed';
        job.error = stderrData || `Scraper exited with code ${code}`;
      }
    });

    child.on('error', err => {
      job.status = 'failed';
      job.completedAt = new Date().toISOString();
      job.error = err.message;
    });

    res.status(202).json({
      jobId,
      status: 'running',
      message: 'Ingestion pipeline triggered'
    });
  } catch (err) {
    next(err);
  }
});

app.get('/ingest/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: `Job with ID "${jobId}" was not found` });
  }
  res.json(job);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`News Pulse Backend API running on port ${PORT}`);
});
