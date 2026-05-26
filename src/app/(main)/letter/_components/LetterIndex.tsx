'use client';

import Link from 'next/link';

/**
 * /letter 메인 컴포지션
 *
 * 컴포넌트 분할 (features/letter/components):
 *   - <ComposeEntryCard />     — 편지 일러스트 위 CTA 버튼
 *   - <ReceivedLetterList />   — 도착한 편지 카드 그리드
 *   - <SentLetterList />       — 내가 보낸 편지 (옵션)
 */
export function LetterIndex() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* A) 편지 보내러 가기 CTA */}
      <Link
        href="/letter/compose"
        style={{
          display: 'block',
          padding: '2rem 1rem',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          background: 'transparent',
        }}
      >
        {/* TODO: 편지 일러스트 배경 + 중앙 CTA 버튼 */}
        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
          편지 보내러 가기 ✉️
        </div>
        <p style={{ color: 'var(--color-muted)', marginTop: 8, fontSize: '0.875rem' }}>
          단 다섯 글자, 누군가에게 닿습니다
        </p>
      </Link>

      {/* B) 도착한 편지 */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          도착한 편지
        </h2>
        {/* TODO: <ReceivedLetterList /> */}
        <Placeholder height={240} />
      </section>

      {/* C) 내가 보낸 편지 (옵션) */}
      <section>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          내가 보낸 편지
        </h2>
        {/* TODO: <SentLetterList /> */}
        <Placeholder height={180} />
      </section>
    </div>
  );
}

function Placeholder({ height }: { height: number }) {
  return (
    <div
      style={{
        height,
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    />
  );
}
