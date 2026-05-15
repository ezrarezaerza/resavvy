import React from 'react';
import { Clock, Play, ChevronUp, ChevronDown } from 'lucide-react';

export type SortKey = 'title' | 'artist' | 'playCount' | 'createdAt' | 'duration';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface TracklistHeaderProps {
  selectionMode?: boolean;
  selectedCount?: number;
  totalCount?: number;
  onToggleSelectAll?: () => void;
  sortConfig?: SortConfig;
  onSort?: (key: SortKey) => void;
  variant?: 'default' | 'explore';
}

export function TracklistHeader({
  selectionMode,
  selectedCount = 0,
  totalCount = 0,
  onToggleSelectAll,
  sortConfig,
  onSort,
  variant = 'default'
}: TracklistHeaderProps) {
  
  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1 inline" /> : <ChevronDown className="w-4 h-4 ml-1 inline" />;
  };

  const handleSort = (key: SortKey) => {
    if (onSort) onSort(key);
  };

  return (
    <div className={`sticky top-0 z-20 hidden md:grid ${selectionMode ? 'grid-cols-[40px_40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_80px_32px] gap-2 px-2' : 'grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_80px_32px] gap-4 px-4'} py-3 border-b border-gray-200/50 dark:border-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl mb-2 shadow-sm dark:shadow-none`}>
      {selectionMode && (
        <div className="flex items-center justify-center shrink-0">
          <div 
            onClick={onToggleSelectAll}
            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${selectedCount === totalCount && totalCount > 0 ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500' : 'border-gray-400 dark:border-gray-500'}`}
          >
            {selectedCount === totalCount && totalCount > 0 && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
      )}
      <div className="text-center font-bold">{variant === 'explore' ? 'Rank' : '#'}</div>
      <div 
        className={`cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${sortConfig?.key === 'title' ? 'text-gray-900 dark:text-gray-200' : ''}`}
        onClick={() => handleSort('title')}
      >
        Title {renderSortIcon('title')}
      </div>
      <div 
        className={`cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${sortConfig?.key === 'artist' ? 'text-gray-900 dark:text-gray-200' : ''}`}
        onClick={() => handleSort('artist')}
      >
        Artist {renderSortIcon('artist')}
      </div>
      <div 
        className={`text-right pr-4 tracking-wider flex items-center justify-end gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${sortConfig?.key === 'playCount' ? 'text-gray-900 dark:text-gray-200' : ''}`}
        onClick={() => handleSort('playCount')}
      >
        {variant === 'explore' ? 'GLOBAL PLAYS' : <><Play className="w-3 h-3"/> PLAYS</>} {renderSortIcon('playCount')}
      </div>
      <div 
        className={`text-right flex items-center justify-end cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 transition-colors ${sortConfig?.key === 'duration' ? 'text-gray-900 dark:text-gray-200' : ''}`}
        onClick={() => handleSort('duration')}
      >
        {variant === 'explore' ? 'POPULARITY' : <><Clock className="w-4 h-4 inline-block" /></>} {renderSortIcon('duration')}
      </div>
      <div className="w-8"></div>
    </div>
  );
}
