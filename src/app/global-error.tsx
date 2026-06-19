'use client';

/**
 * 최상위(루트 레이아웃 자체) 에러 boundary — Next.js 권장.
 *
 * 동작:
 *   - 세그먼트별 error.tsx(/letter/error.tsx 등)는 그 세그먼트만 격리.
 *   - 이 파일은 root layout 자체가 깨졌을 때 (예: Providers/QueryClient 마운트 실패) 최후 폴백.
 *   - global-error는 root layout을 대체하므로 <html>/<body> 직접 렌더 필요.
 *
 * 토큰 동기화 주의 (2026-06-19): CSS variables 미동작 (root layout 파괴) →
 * inline style 의 hex 직접. _color.scss 토큰 변경 시 본 file 도 수동 갱신.
 *   - fg #151515 / muted #393939 / border #c6c6c6 / bg #ffffff
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          color: '#151515',
        }}
      >
        <main style={{ maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            문제가 발생했어요
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#393939',
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
                background: '#151515',
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
                color: '#151515',
                border: '1px solid #c6c6c6',
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
