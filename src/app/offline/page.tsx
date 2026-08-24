import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/**
 * PWA 오프라인 fallback (/offline)
 *
 * SW 가 캐시한 적 없는 페이지에 오프라인 진입 시 표시.
 * Serwist fallbacks.entries 에서 navigate(document) 요청이 실패하면
 * 이 경로로 라우팅 (src/app/sw.ts).
 *
 * Server Component — 빌드 시점에 정적 생성.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pwa.offline');
  return { title: t('title') };
}

export default async function OfflinePage() {
  const t = await getTranslations('pwa.offline');

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <WifiOff size={48} color="var(--color-muted)" />
      <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
        {t('title')}
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
        {t('message')}
      </p>
    </main>
  );
}
