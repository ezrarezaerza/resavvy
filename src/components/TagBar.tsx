import React from 'react';

interface TagBarProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagBar({ tags, selectedTag, onSelectTag }: TagBarProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="sticky top-0 z-30 w-full bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 -mx-6 px-6 md:-mx-8 md:px-8 py-4 mb-8">
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x">
        <button
          onClick={() => onSelectTag(null)}
          className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all snap-start ${
            selectedTag === null
              ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
              : 'bg-transparent border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
            className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all snap-start ${
              selectedTag === tag
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-transparent border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
