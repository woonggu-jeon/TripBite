import { Skeleton } from '@/components/feedback/Skeleton';

/** /tournament — 토너먼트 setup (테마 / 사이즈 / 시작 버튼). */
export default function TournamentSetupLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-4)',
      }}
    >
      {/* 테마 섹션 (계절 4 chip) */}
      <Skeleton width="30%" height={20} radius="sm" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={56} radius="md" />
        ))}
      </div>
      {/* 사이즈 선택 (4/8/16/32) */}
      <Skeleton width="30%" height={20} radius="sm" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={48} radius="md" />
        ))}
      </div>
      {/* 시군 / 카테고리 필터 */}
      <Skeleton width="100%" height={56} radius="md" />
      {/* 시작 버튼 */}
      <Skeleton width="100%" height={56} radius="md" />
    </div>
  );
}
