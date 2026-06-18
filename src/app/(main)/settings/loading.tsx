import { Skeleton } from '@/components/feedback/Skeleton';

/** /settings — 설정 list (섹션 헤더 + row 6-8개). */
export default function SettingsLoading() {
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        display: 'grid',
        gap: 'var(--space-3)',
      }}
    >
      <Skeleton width="30%" height={20} radius="sm" />
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={`a-${i}`} width="100%" height={56} radius="md" />
      ))}
      <Skeleton width="30%" height={20} radius="sm" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`b-${i}`} width="100%" height={56} radius="md" />
      ))}
    </div>
  );
}
