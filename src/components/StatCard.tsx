import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-gray-500 dark:text-gray-400 font-semibold text-sm tracking-widest uppercase">
          {title}
        </h4>
        {Icon && <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
      </div>
      <div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        {value}
      </div>
    </div>
  );
}
