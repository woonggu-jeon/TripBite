'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { Icon } from '@/components/icon';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { LetterActions } from '@/features/letter/components/LetterActions';
import styles from './LetterDetailClient.module.scss';

/**
 * 받은 편지 상세 (/letter/[id]) — Figma `받은 편지 상세` 실측.
 *
 *   ┌──────────────────────────────────────┐
 *   │        (84 원 + letter 아이콘)         │  emptyItme
 *   │        편지가 도착했어요               │  14 Bold
 *   │   누군가 당신에게 …                   │  12 Regular
 *   ├──────────────────────────────────────┤  gap 40
 *   │ [사진+도착도장]  From / 닉네임         │  card #F6F6F6
 *   │ ┌──┬──┬──┬──┬──┐                     │  letterBox 5칸
 *   │ │보│고│싶│었│어│                     │  24 Bold, 칸 보더 #E1493C
 *   │ └──┴──┴──┴──┴──┘                     │
 *   │ ────────────────                     │  divider
 *   │ To 여행한입러 / 2024.05.12 도착        │
 *   ├──────────────────────────────────────┤
 *   │ 저장하지 않으면 3일 후 자동 삭제돼요    │
 *   ├──────────────────────────────────────┤
 *   │ [삭제]     [저장]                     │  156x52 x2
 *   │ [ 편지함으로 ]                        │  320x52 라인
 *   └──────────────────────────────────────┘
 *
 * 구 구현은 베이지 편지지 + 점선 + STAMP 배지 + 좋아요/저장/삭제 3버튼이었다.
 * 시안에는 좋아요가 없다 (목록 행의 액션도 하트가 아니라 북마크) — 상세의
 * 액션은 삭제/저장 둘이다.
 */
function formatArrival(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function LetterDetailClient({ letterId }: { letterId: string }) {
  const router = useRouter();
  const t = useTranslations('letter.detail');
  const tAuthor = useTranslations('letter.author');
  const { data: letter, isLoading, isError, refetch } = useLetter(letterId);

  if (isLoading) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={144} radius="lg" />
        <Skeleton width="100%" height={274} radius="lg" />
        <Skeleton width="100%" height={52} radius="md" />
      </div>
    );
  }

  if (isError || !letter) {
    return (
      <div className={styles.empty}>
        <p>{t('loadError')}</p>
        <div className={styles.emptyActions}>
          <Button variant="secondary" onClick={() => refetch()}>
            {t('retry')}
          </Button>
          <Button variant="primary" onClick={() => router.replace('/letter')}>
            {t('backToList')}
          </Button>
        </div>
      </div>
    );
  }

  const senderName = letter.author.nickname || tAuthor('anonymous');
  const senderLocation = letter.author.location;
  const arrivedIso = letter.arrivedAt ?? letter.createdAt;
  // Figma letterBox 는 5칸 고정 — 본문이 짧으면 남은 칸은 빈 칸으로 둔다.
  const cells = Array.from({ length: 5 }, (_, i) => [...letter.body][i] ?? '');

  return (
    <div className={styles.wrap}>
      {/* Figma `emptyItme` — 84 원 + 36 아이콘 + 제목/보조, 중앙 정렬 */}
      <header className={styles.arrived} role="status">
        <span className={styles.arrivedCircle} aria-hidden>
          <Icon name="letter-36" size={36} />
        </span>
        {/* Figma `f` — 제목 ↔ 보조는 gap 3, 원 ↔ 텍스트 블록이 gap 20 */}
        <span className={styles.arrivedText}>
          <span className={styles.arrivedTitle}>{t('arrivedTitle')}</span>
          <span className={styles.arrivedBody}>{t('arrivedBody')}</span>
        </span>
      </header>

      <div className={styles.cardGroup}>
        {/* Figma `Frame 79` — 회색 면 카드 */}
        <article className={styles.card} aria-label={t('letterAria')}>
          <div className={styles.top}>
            {/* Figma `pw` — 사진 60 + 도착 도장 70 겹침 */}
            <div className={styles.postmarkWrap} aria-hidden>
              <span className={styles.photo} />
              <span className={styles.postmark}>
                <span className={styles.postmarkLabel}>
                  {t('postmarkArrived')}
                </span>
                <span className={styles.postmarkName}>{senderLocation}</span>
              </span>
            </div>
            <div className={styles.meta}>
              <p className={styles.metaLabel}>{t('from')}</p>
              <p className={styles.metaValue}>{senderName}</p>
            </div>
          </div>

          {/* Figma `letterBox` — 5칸, 칸마다 흰 면 + 빨간 보더 */}
          <div className={styles.letterBox} aria-label={letter.body}>
            {cells.map((ch, i) => (
              <span key={i} className={styles.cell} aria-hidden>
                {ch}
              </span>
            ))}
          </div>

          <div className={styles.footer}>
            <span className={styles.divider} aria-hidden />
            <div className={styles.footerText}>
              <p className={styles.toRow}>
                <span className={styles.metaLabel}>{t('to')}</span>
                <span className={styles.toName}>{t('toYou')}</span>
              </p>
              <p className={styles.arrivedAt}>
                <time dateTime={arrivedIso}>{formatArrival(arrivedIso)}</time>{' '}
                {t('postmarkArrived')}
              </p>
            </div>
          </div>
        </article>

        {/* 자동 삭제 안내 — saved 면 숨김 */}
        {!letter.saved && (
          <p className={styles.autoDelete} role="note">
            {t('autoDeleteNotice')}
          </p>
        )}
      </div>

      <LetterActions letter={letter} />
    </div>
  );
}
