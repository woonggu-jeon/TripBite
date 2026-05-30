'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * 최상위(루트 레이아웃 자체) 에러 boundary — Next.js 권장.
 *
 * 동작:
 *   - 세그먼트별 error.tsx(/letter/error.tsx 등)는 그 세그먼트만 격리.
 *   - 이 파일은 root layout 자체가 깨졌을 때 (예: Providers/QueryClient 마운트 실패) 최후 폴백.
 *   - global-error는 root layout을 대체하므로 <html>/<body> 직접 렌더 필요.
 *   - Sentry는 DSN 가드 통과 시 자동 캡처(no-op 그렇지 않으면).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif',
          background: '#fff',
          color: '#0a0a0a',
        }}
      >
        <main style={{ maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            문제가 발생했어요
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginBottom: 24,
            }}
          >
            잠시 후 다시 시도해주세요. 문제가 계속되면 도움이 필요해요.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.25rem',
                background: '#0a0a0a',
                color: '#fff',
                border: 0,
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            {/* global-error 는 root layout 파괴 상태 — next/link 동작 보장 X.
                hard navigation 으로 / 이동 (전체 재초기화 의도). */}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                padding: '0.75rem 1.25rem',
                background: '#fff',
                color: '#0a0a0a',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              홈으로
            </button>
          </div>
          {error.digest && (
            <p
              style={{
                marginTop: 16,
                fontSize: '0.75rem',
                color: '#9ca3af',
              }}
            >
              digest: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
