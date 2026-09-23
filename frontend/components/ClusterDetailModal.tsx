import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, Clock, Layers } from 'lucide-react';
import { ClusterDetail } from '../types';
import { getClusterById } from '../lib/api';

interface ClusterDetailModalProps {
  clusterId: string | null;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'BBC News': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  'NPR': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  'Al Jazeera': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'The Guardian': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' }
};

function formatIsoDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  } catch {
    return iso;
  }
}

export default function ClusterDetailModal({ clusterId, onClose }: ClusterDetailModalProps) {
  const [detail, setDetail] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clusterId) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getClusterById(clusterId)
      .then(res => {
        if (isMounted) {
          setDetail(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clusterId, onClose]);

  if (!clusterId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">Topic Cluster Detail</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-slate-400">Loading topic articles and metadata...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {detail.representativeTitle || detail.label}
                </h2>

                {detail.keywords && detail.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {detail.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-slate-400">Articles In Cluster</div>
                    <div className="text-slate-100 font-semibold">{detail.articleCount} coverage entries</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-slate-400">Earliest Article</div>
                    <div className="text-slate-100 font-medium">{formatIsoDate(detail.timeRange.earliest)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-slate-400">Latest Article</div>
                    <div className="text-slate-100 font-medium">{formatIsoDate(detail.timeRange.latest)}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                    Chronological Coverage ({detail.articles.length})
                  </h3>
                  <span className="text-xs text-slate-400">Sorted earliest to latest</span>
                </div>

                <div className="space-y-3">
                  {detail.articles.map((art, idx) => {
                    const color = SOURCE_COLORS[art.source] || {
                      bg: 'bg-slate-800',
                      text: 'text-slate-300',
                      border: 'border-slate-700'
                    };

                    return (
                      <div
                        key={art.id}
                        className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}
                            >
                              {art.source}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatIsoDate(art.publishedAt)}</span>
                          </div>
                        </div>

                        <h4 className="text-base font-semibold text-slate-100 leading-snug">
                          {art.title}
                        </h4>

                        {art.summary && (
                          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                            {art.summary}
                          </p>
                        )}

                        <div className="pt-1 flex justify-end">
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                          >
                            <span>Read Full Article</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
}
