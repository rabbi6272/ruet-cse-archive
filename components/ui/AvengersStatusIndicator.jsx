"use client";

import { useState, useEffect } from 'react';

const AvengersStatusIndicator = ({ unsolvedDoubtsCount }) => {
  const [isAssemblyActive, setIsAssemblyActive] = useState(false);

  useEffect(() => {
    setIsAssemblyActive(unsolvedDoubtsCount > 0);
  }, [unsolvedDoubtsCount]);

  if (!isAssemblyActive) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-2xl animate-pulse">🚨</span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
              🦸 Avenger Assemble! Someone needs help.
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400">
              {unsolvedDoubtsCount} {unsolvedDoubtsCount === 1 ? 'coder needs' : 'coders need'} your help!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a class="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 font-medium text-sm px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700" href="/reviewers/dashboard"><i class="fas fa-external-link-alt text-xs"></i><span>Open doubts now</span><span class="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-bold">1</span></a>
        </div>
      </div>
    </div>
  );
};

export default AvengersStatusIndicator;
