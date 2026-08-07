'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Button } from '@/components/ui';
import { Icon } from '@/components/icon';
import { SubHeader } from '@/components/layout/SubHeader';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { LetterActions } from '@/features/letter/components/LetterActions';
import { LetterPaper } from '@/features/letter/components/LetterPaper';
import { useAuthStore } from '@/stores/auth-store';
import styles from './LetterDetailClient.module.scss';

/**
 * 편지 상세 (/letter/[id]) — `letter.isMine` 으로 두 화면이 갈린다.
 *
 * 받은 편지 (Figma `받은 편지 상세`)
 *   84 원 + letter 아이콘 / "편지가 도착했어요"
 *   카드: 사진 옆 From·보낸이 (좌측 정렬), 하단 To·받는이 + 도착일
 *   액션: [삭제][저장] + [편지함으로], 저장 안 하면 3일 후 삭제 안내
 *
 * 보낸 편지 (Figma `편지 발송완료` 와 같은 배치)
 *   84 원 + **체크** 아이콘 / "전송 완료"
 *   카드: 사진 반대편 To·받는이 (우측 정렬), 하단 From·나 + 발송일
 *   액션: [편지함으로] 하나 — 저장/삭제는 받은 편지의 개념이라 노출하지 않는다
 *
 * 보낸 편지 목록에서 눌렀는데 "도착한 편지" 화면이 뜨던 버그를 고친 부분이다.
 * 헤더 제목도 isMine 에 따라 달라지므로 page.tsx 대신 여기서 렌더한다.
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function LetterDetailClient({ letterId }: { letterId: string }) {
  const router = useRouter();
  const t = useTranslations('letter.detail');
  const tSent = useTranslations('letter.sent');
  const tAuthor = useTranslations('letter.author');
  const myAvatarUrl = useAuthStore((s) => s.user?.avatarUrl);
  const { data: letter, isLoading, isError, refetch } = useLetter(letterId);

  if (isLoading) {
    return (
      <>
        <SubHeader title={t('title')} />
        <div className={styles.wrap}>
          <Skeleton width="100%" height={144} radius="lg" />
          <Skeleton width="100%" height={274} radius="lg" />
          <Skeleton width="100%" height={52} radius="md" />
        </div>
      </>
    );
  }

  if (isError || !letter) {
    return (
      <>
        <SubHeader title={t('title')} />
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
      </>
    );
  }

  const isMine = letter.isMine;
  const authorName = letter.author.nickname || tAuthor('anonymous');
  const location = letter.author.location;
  const iso = isMine
    ? letter.createdAt
    : (letter.arrivedAt ?? letter.createdAt);

  return (
    <>
      <SubHeader title={isMine ? tSent('title') : t('title')} />
      <div className={styles.wrap}>
        <header className={styles.arrived} role="status">
          <span className={styles.arrivedCircle} aria-hidden>
            <Icon name={isMine ? 'check-36' : 'letter-36'} size={36} />
          </span>
          <span className={styles.arrivedText}>
            <span className={styles.arrivedTitle}>
              {isMine ? tSent('noticeTitle') : t('arrivedTitle')}
            </span>
            <span className={styles.arrivedBody}>
              {isMine ? tSent('noticeBody') : t('arrivedBody')}
            </span>
          </span>
        </header>

        <div className={styles.cardGroup}>
          {isMine ? (
            <LetterPaper
              ariaLabel={tSent('letterAria')}
              postmarkLabel={tSent('sentBadge')}
              postmarkName={authorName}
              topLabel={t('to')}
              topName={tSent('toRecipient')}
              body={letter.body}
              bottomLabel={t('from')}
              bottomName={location ? `${authorName} · ${location}` : authorName}
              dateText={
                <>
                  <time dateTime={iso}>{formatDate(iso)}</time>{' '}
                  {tSent('sentSuffix')}
                </>
              }
              photoUrl={myAvatarUrl}
              align="right"
            />
          ) : (
            <LetterPaper
              ariaLabel={t('letterAria')}
              postmarkLabel={t('postmarkArrived')}
              postmarkName={location}
              topLabel={t('from')}
              topName={authorName}
              body={letter.body}
              bottomLabel={t('to')}
              bottomName={t('toYou')}
              dateText={
                <>
                  <time dateTime={iso}>{formatDate(iso)}</time>{' '}
                  {t('postmarkArrived')}
                </>
              }
            />
          )}

          {/* 자동 삭제는 받은 편지 정책 — 내가 보낸 편지엔 해당 없음 */}
          {!isMine && !letter.saved && (
            <p className={styles.autoDelete} role="note">
              {t('autoDeleteNotice')}
            </p>
          )}
        </div>

        {isMine ? (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            className={styles.lineButton}
            onClick={() => router.push('/letter?tab=sent')}
          >
            {t('backToList')}
          </Button>
        ) : (
          <LetterActions letter={letter} />
        )}
      </div>
    </>
  );
}
