import { Skeleton } from '@/components/feedback/Skeleton';
import { SubHeaderSkeleton } from '@/components/feedback/SubHeaderSkeleton';

/**
 * /tournament cold start fallback — TournamentSetup 첫 화면 (step 1) 정합.
 *   - wrap: padding 20, gap 20 (var(--space-5)), bg #F8F8F8
 *   - heading (Frame 41): B_20 title + R_12 hint gap 8
 *   - section: ThemeKindSelector placeholder (2 cards stacked)
 *   - autoHint fixed bottom (step 1/2/3)
 */
export default function TournamentSetupLoading() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-5)',
        background: '#F8F8F8',
        marginLeft: 'calc(-1 * var(--content-pad))',
        marginRight: 'calc(-1 * var(--content-pad))',
        marginBottom: 'calc(-1 * var(--content-pad))',
        paddingTop: 'var(--space-5)',
        paddingLeft: 'var(--space-5)',
        paddingRight: 'var(--space-5)',
        paddingBottom: 'calc(52px + var(--space-4) + var(--space-5))',
        minHeight: 'calc(100vh - var(--header-h))',
      }}
    >
      <SubHeaderSkeleton wrapPadding={20} />
      {/* heading — gap 8 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="60%" height={20} radius="sm" />
        <Skeleton width="80%" height={12} radius="sm" />
      </div>
      {/* section — ThemeKindSelector 2 card column gap 20 */}
      <div style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <Skeleton width="100%" height={120} radius="md" />
        <Skeleton width="100%" height={120} radius="md" />
      </div>
    </div>
  );
}
