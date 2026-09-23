export interface TimeRange {
  earliest: string;
  latest: string;
}

export interface Article {
  id: number;
  url: string;
  title: string;
  summary: string;
  snippet?: string;
  publishedAt: string;
  source: string;
  createdAt: string;
}

export interface ClusterSummary {
  id: string;
  label: string;
  keywords: string[];
  representativeTitle: string;
  articleCount: number;
  timeRange: TimeRange;
  sources: string[];
  updatedAt: string;
}

export interface ClusterDetail extends ClusterSummary {
  articles: Article[];
}

export interface TimelineCluster {
  id: string;
  label: string;
  representativeTitle: string;
  keywords: string[];
  articleCount: number;
  startTime: string;
  endTime: string;
  startTimestamp: number;
  endTimestamp: number;
  durationHours: number;
  intensity: number;
  sources: string[];
}

export interface SourceCount {
  source: string;
  article_count: number;
}

export interface IngestJob {
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt: string | null;
  result?: {
    status: string;
    new_articles_ingested: number;
    total_clusters_generated: number;
  } | null;
  error?: string | null;
}
