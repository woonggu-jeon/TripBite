import Link from 'next/link';

export default function NotFound() {
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
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>404</h1>
      <p style={{ color: 'var(--color-muted)' }}>
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        홈으로
      </Link>
    </main>
  );
}
