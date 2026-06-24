import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /quiz/result cold start fallback — TravelTypeResult mount 후 첫 화면 정합.
 *   - wrap: column gap 20 padding 0 20 20 bg surface-soft
 *   - banner: 320×247 secondary01 + primary 1px border (emoji 52 + pill + title)
 *   - section: B_18 + recommend horizontal list
 *   - actions: row [outline + primary] + outline
 *
 * client 의 isLoading 은 단순 텍스트 "loading" 1줄이라 그것 대신 mount 후 실제
 * 레이아웃 placeholder 로 정합 — cold → mount 시각 jump 최소화.
 */
export default function QuizResultLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        padding: '0 20px 20px',
      }}
    >
      {/* banner 320×247 — emoji 52 + codePill 73×20 + title + keywords + desc */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '28px 22px 24px',
          borderRadius: 12,
          minHeight: 247,
        }}
      >
        <Skeleton width={52} height={52} radius="full" />
        <Skeleton width={73} height={20} radius="full" />
        <Skeleton width="70%" height={24} radius="md" />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Skeleton width={56} height={20} radius="full" />
          <Skeleton width={56} height={20} radius="full" />
          <Skeleton width={56} height={20} radius="full" />
        </div>
        <Skeleton width="90%" height={14} radius="sm" />
        <Skeleton width="80%" height={14} radius="sm" />
      </div>
      {/* recommend section — sec-title + horizontal scroll list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton width="40%" height={18} radius="sm" />
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
          <Skeleton width={136} height={180} radius="md" />
          <Skeleton width={136} height={180} radius="md" />
          <Skeleton width={136} height={180} radius="md" />
        </div>
      </div>
      {/* actions — row + outline full */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Skeleton width="100%" height={52} radius="md" />
          <Skeleton width="100%" height={52} radius="md" />
        </div>
        <Skeleton width="100%" height={52} radius="md" />
      </div>
    </div>
  );
}
