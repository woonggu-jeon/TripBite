'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from '@/lib/toast';

/**
 * 세션 만료 안내 watcher.
 *
 * interceptor (services/interceptors/auth.ts) 가 401 발생 + 로그인 상태였던
 * 경우 `auth:session-expired` window event dispatch. 본 컴포넌트가 listen +
 * i18n toast 한 번만 표시 (interceptor 의 module flag 가 중복 방지).
 *
 * providers.tsx 안에서 mount — NextIntl provider 안쪽 (useTranslations 가능).
 * 렌더 X — listener 만.
 */
export function SessionExpiredWatcher() {
  const t = useTranslations('common');

  useEffect(() => {
    const handler = () => {
      toast.warning(t('sessionExpired'));
    };
    window.addEventListener('auth:session-expired', handler);
    return () => {
      window.removeEventListener('auth:session-expired', handler);
    };
  }, [t]);

  return null;
}
