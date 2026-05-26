'use client';

import { useEffect, useState } from 'react';

/**
 * 온라인/오프라인 상태 훅
 *
 * 사용:
 *   const isOnline = useOnline();
 *   {!isOnline && <OfflineBanner />}
 */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOnline(navigator.onLine);

    function up() { setOnline(true); }
    function down() { setOnline(false); }
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return online;
}
