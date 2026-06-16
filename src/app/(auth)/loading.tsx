import { Skeleton } from '@/components/feedback/Skeleton';

/**
 * (auth) 그룹 공용 cold start fallback — `/login`, `/signup`, `/find-id`,
 * `/forgot-password`, `/reset-password`, `/onboarding` 진입 시.
 *
 * AuthLayout 의 center 정렬 shell 을 흉내 — title + 2~3 input + 큰 버튼 형태.
 */
export default function AuthLoading() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          display: 'grid',
          gap: 'var(--space-3)',
        }}
      >
        <Skeleton width="60%" height={32} radius="md" />
        <Skeleton width="100%" height={56} radius="md" />
        <Skeleton width="100%" height={56} radius="md" />
        <Skeleton width="100%" height={48} radius="md" />
      </div>
    </div>
  );
}
