import React from 'react';
import { Newspaper, RefreshCw, Zap, Clock, ShieldCheck } from 'lucide-react';
import { IngestJob } from '../types';

interface NavbarProps {
  onRefresh: () => void;
  isIngesting: boolean;
  activeJob: IngestJob | null;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  totalClusters: number;
  totalArticles: number;
}

export default function Navbar({
  onRefresh,
  isIngesting,
  activeJob,
  autoRefresh,
  setAutoRefresh,
  totalClusters,
  totalArticles
}: NavbarProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-lg text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">News Pulse</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                  Live Monitor
                </span>
              </div>
              <p className="text-xs text-slate-400">Topic-Clustered News Timeline & Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center space-x-4 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400">Clusters:</span>
                <span className="font-semibold text-slate-100">{totalClusters}</span>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">Articles:</span>
                <span className="font-semibold text-slate-100">{totalArticles}</span>
              </div>
            </div>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                autoRefresh
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-refresh {autoRefresh ? 'On (30s)' : 'Off'}</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isIngesting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all ${
                isIngesting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-indigo-600/25'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isIngesting ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isIngesting ? 'Ingesting Feeds...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {isIngesting && (
          <div className="mt-3 py-2 px-3 bg-indigo-950/60 border border-indigo-800/60 rounded-lg flex items-center justify-between text-xs text-indigo-200 animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Pulling RSS feeds from BBC, NPR, Al Jazeera, Guardian and grouping into topics...</span>
            </div>
            {activeJob && (
              <span className="text-indigo-400 text-[11px] font-mono">Job: {activeJob.jobId.slice(0, 8)}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
