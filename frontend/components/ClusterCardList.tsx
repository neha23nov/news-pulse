import React from 'react';
import { TimelineCluster } from '../types';
import { Clock, Layers, ChevronRight } from 'lucide-react';

interface ClusterCardListProps {
  clusters: TimelineCluster[];
  onSelectCluster: (id: string) => void;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'BBC News': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  'NPR': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  'Al Jazeera': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'The Guardian': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
};

export default function ClusterCardList({ clusters, onSelectCluster }: ClusterCardListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clusters.map((cluster) => {
        const isMulti = cluster.articleCount > 1;

        return (
          <div
            key={cluster.id}
            onClick={() => onSelectCluster(cluster.id)}
            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
              isMulti
                ? 'bg-slate-900/90 border-indigo-500/40 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 hover:-translate-y-0.5'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isMulti
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    {cluster.articleCount} {cluster.articleCount === 1 ? 'Article' : 'Articles'}
                  </span>

                  {cluster.sources.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      Cross-Source
                    </span>
                  )}
                </div>

                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  <span>{cluster.durationHours.toFixed(1)}h</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
                {cluster.representativeTitle || cluster.label}
              </h3>

              {cluster.keywords && cluster.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {cluster.keywords.slice(0, 3).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-800/90 text-slate-400 border border-slate-700/50"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/70 flex items-center justify-between text-xs">
              <div className="flex flex-wrap gap-1">
                {cluster.sources.map((src, i) => {
                  const s = SOURCE_COLORS[src] || {
                    bg: 'bg-slate-800',
                    text: 'text-slate-400',
                    border: 'border-slate-700'
                  };
                  return (
                    <span
                      key={i}
                      className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${s.bg} ${s.text} ${s.border}`}
                    >
                      {src}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center text-indigo-400 font-semibold group-hover:text-indigo-300">
                <span>View</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
