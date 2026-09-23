import React from 'react';
import { Filter, Search, Radio } from 'lucide-react';
import { SourceCount } from '../types';

interface SourceFilterProps {
  sources: SourceCount[];
  selectedSource: string;
  onSelectSource: (src: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  multiOnly: boolean;
  onToggleMultiOnly: () => void;
  viewMode: 'timeline' | 'cards';
  onToggleViewMode: (mode: 'timeline' | 'cards') => void;
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'BBC News': { bg: 'bg-red-500/10 hover:bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  'NPR': { bg: 'bg-sky-500/10 hover:bg-sky-500/20', text: 'text-sky-400', dot: 'bg-sky-500' },
  'Al Jazeera': { bg: 'bg-amber-500/10 hover:bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'The Guardian': { bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' }
};

export default function SourceFilter({
  sources,
  selectedSource,
  onSelectSource,
  searchQuery,
  onSearchChange,
  multiOnly,
  onToggleMultiOnly,
  viewMode,
  onToggleViewMode
}: SourceFilterProps) {
  const totalAll = sources.reduce((acc, curr) => acc + curr.article_count, 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md backdrop-blur-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-xs font-semibold text-slate-400 mr-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Sources:
          </div>

          <button
            onClick={() => onSelectSource('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedSource === ''
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-500'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            All Sources
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-900/60 text-slate-300">
              {totalAll}
            </span>
          </button>

          {sources.map(s => {
            const isSelected = selectedSource === s.source;
            const styling = SOURCE_COLORS[s.source] || {
              bg: 'bg-slate-800',
              text: 'text-slate-300',
              dot: 'bg-slate-400'
            };

            return (
              <button
                key={s.source}
                onClick={() => onSelectSource(s.source)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-slate-800 text-white border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${styling.dot}`}></span>
                <span>{s.source}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] bg-slate-950/60 text-slate-400">
                  {s.article_count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics, keywords..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full sm:w-56 pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={onToggleMultiOnly}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              multiOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Multi-article Only</span>
          </button>

          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onToggleViewMode('timeline')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline View
            </button>
            <button
              onClick={() => onToggleViewMode('cards')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cards View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
