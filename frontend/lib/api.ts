import { ClusterDetail, ClusterSummary, IngestJob, SourceCount, TimelineCluster } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getClusters(source?: string): Promise<{ total: number; clusters: ClusterSummary[] }> {
  const url = new URL(`${API_BASE}/clusters`);
  if (source) {
    url.searchParams.set('source', source);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch clusters: ${res.statusText}`);
  }
  return res.json();
}

export async function getClusterById(id: string): Promise<ClusterDetail> {
  const res = await fetch(`${API_BASE}/clusters/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cluster detail: ${res.statusText}`);
  }
  return res.json();
}

export async function getTimeline(source?: string): Promise<{ count: number; timeline: TimelineCluster[] }> {
  const url = new URL(`${API_BASE}/timeline`);
  if (source) {
    url.searchParams.set('source', source);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch timeline: ${res.statusText}`);
  }
  return res.json();
}

export async function getSources(): Promise<{ sources: SourceCount[] }> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sources: ${res.statusText}`);
  }
  return res.json();
}

export async function triggerIngest(): Promise<{ jobId: string; status: string; message: string }> {
  const res = await fetch(`${API_BASE}/ingest/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to trigger ingestion: ${res.statusText}`);
  }
  return res.json();
}

export async function getIngestStatus(jobId: string): Promise<IngestJob> {
  const res = await fetch(`${API_BASE}/ingest/status/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ingest status: ${res.statusText}`);
  }
  return res.json();
}
