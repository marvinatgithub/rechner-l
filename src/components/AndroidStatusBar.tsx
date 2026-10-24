import React, { useState, useEffect } from 'react';
import { Wifi, Signal, BatteryMedium } from 'lucide-react';

export const AndroidStatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // When installed as native PWA on Android, the operating system already renders the real status bar
  if (isStandalone) {
    return <div className="w-full pt-[max(0.5rem,env(safe-area-inset-top))]" />;
  }

  return (
    <div className="w-full flex items-center justify-between px-6 pt-3 pb-2 text-xs font-medium text-stone-300 select-none z-30">
      {/* Current Time */}
      <div className="font-semibold tracking-tight text-[13px] text-stone-200">
        {timeStr || '12:00'}
      </div>

      {/* Android System Icons */}
      <div className="flex items-center gap-2 text-stone-300">
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-mono">92%</span>
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
