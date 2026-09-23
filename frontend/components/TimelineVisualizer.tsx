import React, { useMemo, useState } from 'react';
import { TimelineCluster } from '../types';
import { Clock, AlertCircle } from 'lucide-react';

interface TimelineVisualizerProps {
  clusters: TimelineCluster[];
  onSelectCluster: (id: string) => void;
  selectedSource: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'BBC News': '#ef4444',
  'NPR': '#0ea5e9',
  'Al Jazeera': '#f59e0b',
  'The Guardian': '#10b981'
};

function formatTickDate(timestamp: number) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatHours(hours: number) {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m span`;
  }
  return `${hours.toFixed(1)}h span`;
}

export default function TimelineVisualizer({
  clusters,
  onSelectCluster,
  selectedSource
}: TimelineVisualizerProps) {
  const [hoveredCluster, setHoveredCluster] = useState<TimelineCluster | null>(null);

  const { minTime, maxTime, totalDuration, timeTicks } = useMemo(() => {
    if (clusters.length === 0) {
      const now = Date.now();
      return { minTime: now - 86400000, maxTime: now, totalDuration: 86400000, timeTicks: [] };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const c of clusters) {
      if (c.startTimestamp < min) min = c.startTimestamp;
      if (c.endTimestamp > max) max = c.endTimestamp;
    }

    const paddingMs = Math.max(3600000 * 2, (max - min) * 0.05);
    const paddedMin = min - paddingMs;
    const paddedMax = max + paddingMs;
    const duration = Math.max(paddedMax - paddedMin, 3600000 * 6);

    const stepMs = duration > 86400000 * 2 ? 86400000 / 2 : 3600000 * 4;
    const ticks: number[] = [];
    let current = Math.floor(paddedMin / stepMs) * stepMs;
    while (current <= paddedMax) {
      if (current >= paddedMin) {
        ticks.push(current);
      }
      current += stepMs;
    }

    return {
      minTime: paddedMin,
      maxTime: paddedMax,
      totalDuration: duration,
      timeTicks: ticks
    };
  }, [clusters]);

  const sortedClusters = useMemo(() => {
    return [...clusters].sort((a, b) => {
      if (b.articleCount !== a.articleCount) {
        return b.articleCount - a.articleCount;
      }
      return a.startTimestamp - b.startTimestamp;
    });
  }, [clusters]);

  if (clusters.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">
          {selectedSource ? `No clusters found for ${selectedSource}` : 'No clusters match current filters'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Try clearing search keywords or selecting All Sources to explore news events across monitored feeds.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-100 tracking-tight">Active Topic Timeline</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {clusters.length} Active Windows
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Clusters plotted across time window (earliest to latest published article). Bar width represents duration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Range: {formatTickDate(minTime)} → {formatTickDate(maxTime)}</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1"></span>BBC
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mr-1"></span>NPR
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span>Al Jazeera
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>Guardian
            </span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[850px] p-6">
          <div className="relative h-9 border-b border-slate-800 mb-6 select-none">
            {timeTicks.map((tick, i) => {
              const leftPercent = ((tick - minTime) / totalDuration) * 100;
              return (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {formatTickDate(tick)}
                  </span>
                  <div className="w-px h-2 bg-slate-700 mt-1"></div>
                </div>
              );
            })}
          </div>

          <div className="relative space-y-3.5 pt-1 pb-4">
            <div className="absolute inset-0 pointer-events-none">
              {timeTicks.map((tick, i) => {
                const leftPercent = ((tick - minTime) / totalDuration) * 100;
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px border-r border-dashed border-slate-800/80"
                    style={{ left: `${leftPercent}%` }}
                  />
                );
              })}
            </div>

            {sortedClusters.map((cluster) => {
              const startOffset = Math.max(0, ((cluster.startTimestamp - minTime) / totalDuration) * 100);
              const durationPercent = ((cluster.endTimestamp - cluster.startTimestamp) / totalDuration) * 100;
              const widthPercent = Math.min(100 - startOffset, Math.max(3.8, durationPercent));

              const isMultiArticle = cluster.articleCount > 1;
              const isMultiSource = cluster.sources.length > 1;

              return (
                <div key={cluster.id} className="relative group flex items-center h-12">
                  <div
                    onClick={() => onSelectCluster(cluster.id)}
                    onMouseEnter={() => setHoveredCluster(cluster)}
                    onMouseLeave={() => setHoveredCluster(null)}
                    style={{
                      left: `${startOffset}%`,
                      width: `${widthPercent}%`
                    }}
                    className={`absolute cursor-pointer transition-all duration-150 rounded-xl px-3 py-1.5 flex items-center justify-between border shadow-sm select-none ${
                      isMultiArticle
                        ? 'bg-gradient-to-r from-indigo-900/90 via-slate-800/95 to-slate-900/90 border-indigo-500/50 hover:border-indigo-400 hover:ring-2 hover:ring-indigo-500/30 hover:scale-[1.01] z-10'
                        : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800 hover:border-slate-500 z-0'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      {isMultiArticle ? (
                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/50">
                          {cluster.articleCount}
                        </span>
                      ) : (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-slate-500"></span>
                      )}

                      <span className="truncate text-xs font-semibold text-slate-200">
                        {cluster.representativeTitle || cluster.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      {isMultiSource && (
                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                          Merged
                        </span>
                      )}

                      <div className="flex -space-x-1">
                        {cluster.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="w-2.5 h-2.5 rounded-full border border-slate-900"
                            style={{ backgroundColor: SOURCE_COLORS[src] || '#94a3b8' }}
                            title={src}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hoveredCluster && (
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-600 text-white shrink-0">
              {hoveredCluster.articleCount} {hoveredCluster.articleCount === 1 ? 'Article' : 'Articles'}
            </span>
            <span className="font-semibold text-slate-100 truncate">
              {hoveredCluster.representativeTitle || hoveredCluster.label}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400 shrink-0">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatHours(hoveredCluster.durationHours)}</span>
            </span>
            <span>|</span>
            <span>{formatTickDate(hoveredCluster.startTimestamp)}</span>
            <span>→</span>
            <span>{formatTickDate(hoveredCluster.endTimestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
