import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * /tournament/play cold start fallback — intro phase 첫 화면 정합.
 *   - column center gap 30 padding 0 30 (TournamentPlayClient.intro)
 *   - circle-stack 134 + title 19h + 3 dots
 *   - 실 mount 후 첫 화면이 intro 라 그대로 placeholder.
 */
export default function TournamentPlayLoading() {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
        minHeight: 'calc(100dvh - 200px)',
        padding: '0 30px',
        overflow: 'hidden',
      }}
    >
      {/* circle-stack 134 */}
      <Skeleton width={134} height={134} radius="full" />
      {/* introTitle — 19px 1줄 */}
      <Skeleton width="80%" height={19} radius="sm" />
      {/* 3 dots — 9×9 gap 8 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Skeleton width={9} height={9} radius="full" />
        <Skeleton width={9} height={9} radius="full" />
        <Skeleton width={9} height={9} radius="full" />
      </div>
    </div>
  );
}
