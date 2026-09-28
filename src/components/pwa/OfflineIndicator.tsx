import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-stone-900/90 text-white px-3.5 py-1.5 text-xs font-medium backdrop-blur-md shadow-lg border border-stone-800 animate-in slide-in-from-top duration-300">
      <WifiOff className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
      <span>Offline Mode — Showing cached showcases</span>
    </div>
  );
};
