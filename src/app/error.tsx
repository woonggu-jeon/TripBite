'use client';

import { useEffect } from 'react';

/**
 * App Router Error Boundary
 * 라우트 세그먼트에서 발생한 예외를 캐치.
 * 'use client' 필수 (Next.js 규약)
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 실 서비스에선 Sentry 등으로 전송
    console.error('[App Error]', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
        문제가 발생했습니다
      </h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: 480 }}>
        잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 500,
        }}
      >
        다시 시도
      </button>
    </main>
  );
}
