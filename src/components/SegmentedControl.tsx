import React from 'react';

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  active: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, active, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-black/20 rounded-xl">
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              isActive
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
