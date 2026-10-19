import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col rounded-[12px] overflow-hidden bg-white dark:bg-[#1A2027] border border-[#E8E2D9] dark:border-[#2A3138] animate-pulse">
      <div className="aspect-[16/9] bg-[#E8E2D9]/60 dark:bg-[#2A3138] w-full" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-24 bg-[#E8E2D9]/70 dark:bg-[#2A3138] rounded-full" />
        <div className="h-6 w-3/4 bg-[#E8E2D9]/90 dark:bg-[#2A3138] rounded" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full bg-[#E8E2D9]/50 dark:bg-[#2A3138] rounded" />
          <div className="h-3.5 w-5/6 bg-[#E8E2D9]/50 dark:bg-[#2A3138] rounded" />
        </div>
      </div>
      <div className="px-5 py-3 border-t border-[#E8E2D9]/40 dark:border-[#2A3138] flex justify-between">
        <div className="h-3 w-16 bg-[#E8E2D9]/60 dark:bg-[#2A3138] rounded" />
        <div className="h-3 w-12 bg-[#E8E2D9]/60 dark:bg-[#2A3138] rounded" />
      </div>
    </div>
  );
};
