import React from 'react';
import { cn } from '../../lib/utils';

interface StatusBannerProps {
  dataSource: 'live' | 'fallback';
  error: string | null;
}

const StatusBanner: React.FC<StatusBannerProps> = ({ dataSource, error }) => {
  return (
    <div className={cn(
      "h-6 px-8 flex items-center gap-2 border-b text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors",
      dataSource === 'live' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", dataSource === 'live' ? "bg-emerald-500" : "bg-orange-500 animate-pulse")} />
      <span>{dataSource === 'live' ? 'Private Feed Synchronized' : 'Operational Fallback (Local Cache)'}</span>
      {error && dataSource === 'fallback' && <span className="opacity-50 ml-2">[{error}]</span>}
    </div>
  );
};

export default StatusBanner;
