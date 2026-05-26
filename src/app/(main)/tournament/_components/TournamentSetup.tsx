'use client';

/**
 * 토너먼트 설정 화면
 *
 * 실 컴포넌트는 features/tournament/components 에 분리:
 *   - <ThemeSelector />        — 계절 / 특별한 날
 *   - <CategoryFilter />       — 축제 / 관광지 / 체험관광
 *   - <RegionFilter />         — 지역 (선택)
 *   - <CountSelector />        — 4/8/16/32
 *   - <StartTournamentButton/> — store.set(...) + router.push('/tournament/play')
 */
export function TournamentSetup() {
  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Section title="1. 테마 선택">
        {/* TODO: <ThemeSelector /> — 봄/여름/가을/겨울 + 생일/기념일 */}
        <Box height={120} />
      </Section>

      <Section title="2. 카테고리">
        {/* TODO: <CategoryFilter /> — 축제/관광지/체험관광 (다중) */}
        <Box height={60} />
      </Section>

      <Section title="3. 갯수">
        {/* TODO: <CountSelector /> — 4/8/16/32 */}
        <Box height={60} />
      </Section>

      {/* TODO: <StartTournamentButton /> */}
      <button
        style={{
          padding: '1rem',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-fg)',
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
        }}
        disabled
      >
        시작하기
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Box({ height }: { height: number }) {
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
