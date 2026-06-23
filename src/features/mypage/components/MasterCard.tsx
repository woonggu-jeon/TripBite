import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './MasterCard.module.scss';

/**
 * 충북 마스터 카드 — Figma "MY · 마스터 카드" (2026-06-23).
 *
 * 사용처:
 *   - 도장책 11/11 달성 시 share image 또는 축하 modal 본문
 *   - share image — /api/og/master endpoint 와 별개로 client 자체 카드 노출용
 *
 * spec:
 *   - 360×~448 linear-gradient(#1CE055 → #EDFEF4) + radius 20
 *   - 88 white circle + Trophy 44 primary
 *   - "CHUNGBUK MASTER" Bold 13 ls 0.16em
 *   - "충북 마스터" ExtraBold 30 ls -0.03em
 *   - msg-box white card radius 14 padding 20/18 + Medium 14 line 170% center
 *   - trip-bite-logo (28×25.9 svg + Title B_18 "여행한입")
 */
export function MasterCard() {
  const t = useTranslations('mypage.stampBook');

  return (
    <article className={styles.card} aria-label={t('masterAchieved')}>
      <span className={styles.iconCircle} aria-hidden>
        <Trophy size={44} strokeWidth={2.93} />
      </span>

      <p className={styles.subtitle}>{t('masterEnglish')}</p>
      <h2 className={styles.title}>{t('masterTitle')}</h2>

      <div className={styles.msgBox}>
        <p className={styles.msgText}>{t('masterMessage')}</p>
      </div>

      <div className={styles.brand} aria-hidden>
        {/* trip-bite-logo placeholder — Figma vector 좌표만 있어 정확 path 미정.
            rate limit 풀린 후 SVG export 받으면 정합. 현재는 emoji + text. */}
        <span className={styles.brandIcon}>🥢</span>
        <span className={styles.brandText}>{t('brandName')}</span>
      </div>
    </article>
  );
}
