import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /settings cold start fallback — SettingsClient layout 정합.
 *
 * 구조 (SettingsClient.module.scss `.wrap` gap var(--space-6)):
 *   1) PageSection "알림" — title (14 SemiBold) + 3 row flat (각 ~56h padding
 *      16 20, no border).
 *   2) PageSection "계정/권한" — title + 3 row flat.
 *   3) AccountActionsSection — actionStack padding 20 gap 12, 2 button 52h
 *      (logout outline + withdraw ghost danger).
 *
 * ※ 이전 회귀: PageSection rows 56h border-radius md → flat row (no border)
 *   정정. 2026-06-23 Figma 정합 이후 SettingsRows.scss row 가 padding 16 20
 *   bg 만, divider 없음.
 */
export default function SettingsLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-6)',
      }}
    >
      {/* PageSection "알림" — title 14h + 3 row 56h. */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Skeleton width={48} height={14} radius="sm" />
        <div style={{ display: 'grid', gap: 0 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`n-${i}`} width="100%" height={56} radius="sm" />
          ))}
        </div>
      </section>

      {/* PageSection "계정/권한" — title 14h + 3 row 56h. */}
      <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <Skeleton width={64} height={14} radius="sm" />
        <div style={{ display: 'grid', gap: 0 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={`a-${i}`} width="100%" height={56} radius="sm" />
          ))}
        </div>
      </section>

      {/* AccountActionsSection — padding 20 gap 12, 2 button 52h. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--space-5)',
          gap: 'var(--space-3)',
        }}
      >
        <Skeleton width="100%" height={52} radius="md" />
        <Skeleton width="100%" height={52} radius="md" />
      </div>
    </div>
  );
}
