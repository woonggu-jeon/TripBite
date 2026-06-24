import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * (main) 그룹 공용 cold start fallback — `/` (홈) layout 과 정합.
 *
 * Next.js 가 `(main)/*` 경로의 SSR 가 완료될 때까지 자동 표시.
 * 더 깊은 path 에 자체 `loading.tsx` 있으면 그쪽이 override (예: region/[code]).
 *
 * (main)/layout.tsx 의 HeaderSwitch + BottomNav 는 그대로 보임 — 본 fallback 은
 * content 영역만 채움. HomeDashboard.module.scss `.grid` (column gap 22 +
 * padding-top 4) 과 동일 spacing 으로 cold → mount 전환 시 jump 회피.
 *
 * 구조 (위 → 아래, gap 22):
 *   1) HomeHero — 176h radius-md (HomeHero.tsx isLoading 분기 markup 동일).
 *   2) HomeRecBlock — 28h title + 168h horizontal carousel (152×168 ×3).
 *      ※ HomeRecBlock isLoading 의 28 + 168 단순화 정합.
 *   3) HomeQuickActions — 2 banner row (각 ~82h, column gap 9 radius 12).
 */
export default function MainLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        paddingTop: 4,
      }}
    >
      {/* HomeHero — Figma 320×176 radius-md. */}
      <Skeleton width="100%" height={176} radius="md" />

      {/* HomeRecBlock — sec-title (28) + horizontal 152×168 ×3 carousel. */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton width="100%" height={28} radius="sm" />
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width={152} height={168} radius="md" />
          ))}
        </div>
      </section>

      {/* HomeQuickActions — 2 banner row, column gap 9 radius 12. */}
      <section
        style={{ display: 'flex', flexDirection: 'column', gap: 9 }}
        aria-hidden
      >
        <Skeleton width="100%" height={82} radius="md" />
        <Skeleton width="100%" height={82} radius="md" />
      </section>
    </div>
  );
}
