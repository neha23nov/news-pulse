import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import SourceFilter from '../components/SourceFilter';
import TimelineVisualizer from '../components/TimelineVisualizer';
import ClusterCardList from '../components/ClusterCardList';
import ClusterDetailModal from '../components/ClusterDetailModal';
import { getIngestStatus, getSources, getTimeline, triggerIngest } from '../lib/api';
import { IngestJob, SourceCount, TimelineCluster } from '../types';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function Home() {
  const [timeline, setTimeline] = useState<TimelineCluster[]>([]);
  const [sources, setSources] = useState<SourceCount[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [multiOnly, setMultiOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'cards'>('timeline');

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<IngestJob | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [timelineRes, sourcesRes] = await Promise.all([
        getTimeline(selectedSource || undefined),
        getSources()
      ]);
      setTimeline(timelineRes.timeline);
      setSources(sourcesRes.sources);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load news timeline data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleRefresh = async () => {
    try {
      setIsIngesting(true);
      setNotification(null);
      const triggerRes = await triggerIngest();
      const currentJobId = triggerRes.jobId;

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await getIngestStatus(currentJobId);
          setActiveJob(statusRes);

          if (statusRes.status === 'completed') {
            clearInterval(pollInterval);
            setIsIngesting(false);
            const newCount = statusRes.result?.new_articles_ingested ?? 0;
            const clusterCount = statusRes.result?.total_clusters_generated ?? 0;
            setNotification(`Pipeline finished: ${newCount} new articles ingested, ${clusterCount} clusters generated.`);
            await loadData();
          } else if (statusRes.status === 'failed') {
            clearInterval(pollInterval);
            setIsIngesting(false);
            setError(`Ingestion failed: ${statusRes.error || 'Unknown error'}`);
          }
        } catch (pollErr: unknown) {
          clearInterval(pollInterval);
          setIsIngesting(false);
          const msg = pollErr instanceof Error ? pollErr.message : String(pollErr);
          setError(`Error checking ingestion status: ${msg}`);
        }
      }, 1500);
    } catch (err: unknown) {
      setIsIngesting(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to trigger ingestion: ${msg}`);
    }
  };

  const filteredClusters = useMemo(() => {
    return timeline.filter(c => {
      if (multiOnly && c.articleCount < 2) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (c.representativeTitle || '').toLowerCase().includes(q);
        const matchesLabel = (c.label || '').toLowerCase().includes(q);
        const matchesKeywords = c.keywords.some(k => k.toLowerCase().includes(q));
        if (!matchesTitle && !matchesLabel && !matchesKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [timeline, multiOnly, searchQuery]);

  const totalArticles = useMemo(() => {
    return sources.reduce((sum, s) => sum + s.article_count, 0);
  }, [sources]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Head>
        <title>News Pulse | Topic-Clustered News Timeline</title>
        <meta name="description" content="Topic-clustered visual news timeline across BBC, NPR, Al Jazeera, and The Guardian" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar
        onRefresh={handleRefresh}
        isIngesting={isIngesting}
        activeJob={activeJob}
        autoRefresh={autoRefresh}
        setAutoRefresh={setAutoRefresh}
        totalClusters={timeline.length}
        totalArticles={totalArticles}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {notification && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm shadow-md animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 ml-4 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm shadow-md">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-rose-200 ml-4 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <SourceFilter
          sources={sources}
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          multiOnly={multiOnly}
          onToggleMultiOnly={() => setMultiOnly(!multiOnly)}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
        />

        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-400">Loading topic clusters and temporal coordinates...</p>
          </div>
        ) : (
          <>
            {viewMode === 'timeline' ? (
              <TimelineVisualizer
                clusters={filteredClusters}
                onSelectCluster={setSelectedClusterId}
                selectedSource={selectedSource}
              />
            ) : (
              <ClusterCardList
                clusters={filteredClusters}
                onSelectCluster={setSelectedClusterId}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>News Pulse — Topic-Clustered News Timeline &bull; Full-Stack Technical Assessment</p>
      </footer>

      <ClusterDetailModal
        clusterId={selectedClusterId}
        onClose={() => setSelectedClusterId(null)}
      />
    </div>
  );
}
