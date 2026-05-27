import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  percentage: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ label, value, percentage }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-gray-900 dark:text-gray-100 truncate pr-4">{label}</span>
        <span className="text-gray-500 dark:text-gray-400 font-mono shrink-0">{value}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${Math.max(percentage, 1)}%` }} // Minimum 1% so it's visible if > 0
        />
      </div>
    </div>
  );
}
