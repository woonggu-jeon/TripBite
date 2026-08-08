'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icon';
import { useMypage } from '@/features/mypage/hooks/use-mypage';
import styles from './ProfileCard.module.scss';

/**
 * 프로필 카드 — 원형 아바타(닉네임 이니셜 fallback) + 닉네임 + 유형 배지.
 *
 * 아바타 업로드는 Spring 미지원(POST/DELETE /me/avatar 없음, avatarUrl 미제공) →
 * 기능 제거. 아바타는 user 심볼 fallback 고정.
 */
export function ProfileCard() {
  const t = useTranslations('mypage.profile');
  const { data, isLoading } = useMypage();

  const nickname = data?.profile.nickname ?? (isLoading ? '' : t('anonymous'));

  return (
    <article className={styles.card}>
      <div className={styles.avatarWrap}>
        <span className={styles.avatar}>
          <span className={styles.avatarFallback} aria-hidden>
            {/* Figma `profileIcon` 24px — sprite 의 user 심볼 */}
            <Icon name="user" size={24} />
          </span>
        </span>
      </div>

      {/* Figma `pmid` — 닉네임(18 Bold) + 유형 배지(pill), V gap 4 */}
      <div className={styles.body}>
        <h2 className={styles.nickname}>
          {nickname || <span className={styles.nicknameSkeleton} aria-hidden />}
        </h2>

        <TravelTypeField travelType={data?.travelType ?? undefined} />
      </div>
    </article>
  );
}

/**
 * 여행 유형 배지 — Figma `badge`: 연초록 pill + 12px compass + Caption/B_10.
 *
 * 유형 테스트를 한 번도 안 했으면 "새내기 여행자" 로 표시한다 (시안도 이 상태를
 * 그려두었다). 이전 구현은 유형이 없으면 아무 것도 렌더하지 않아 닉네임 아래가
 * 비어 있었다. 유형 적용은 /quiz 결과의 "내 유형으로 적용" 으로만 수행.
 */
function TravelTypeField({
  travelType,
}: {
  travelType?: {
    code?: string;
    title?: string;
    description?: string;
    emoji?: string;
  };
}) {
  const t = useTranslations('mypage.profile.travelType');
  const label = travelType?.title ? `#${travelType.title}` : t('rookie');
  return (
    <div className={styles.travelType} role="group" aria-label={t('label')}>
      <Icon
        name="compass"
        size={12}
        className={styles.travelTypeIcon}
        aria-hidden
      />
      <p className={styles.travelTypeTitle}>{label}</p>
    </div>
  );
}
