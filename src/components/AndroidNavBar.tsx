import React, { useState, useEffect } from 'react';

export const AndroidNavBar: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (isStandalone) {
    return <div className="w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]" />;
  }

  return (
    <div className="w-full h-6 flex items-center justify-center pb-2 select-none pointer-events-none z-30">
      <div className="w-32 h-1 bg-stone-500/50 rounded-full" />
    </div>
  );
};
