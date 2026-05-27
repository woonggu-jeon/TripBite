'use client';

import { useTranslations } from 'next-intl';

/**
 * <ConceptStep /> — 온보딩 step 1
 *
 * 컨셉 소개. 정적 UI + 다음 버튼만.
 * 일러스트는 디자인 확정 후 교체 (지금은 이모지 placeholder).
 */
export function ConceptStep({ onNext }: { onNext?: () => void }) {
  const t = useTranslations('onboarding');

  return (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem',
        padding: '1rem 0',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '4rem', lineHeight: 1 }} aria-hidden>
        🗺️
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
        {t('concept.title')}
      </h2>
      <p
        style={{
          fontSize: '0.95rem',
          color: 'var(--color-muted)',
          lineHeight: 1.6,
        }}
      >
        {t('concept.description')}
      </p>
      <button
        type="button"
        onClick={onNext}
        style={{
          padding: '0.875rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
      >
        {t('next')}
      </button>
    </div>
  );
}
