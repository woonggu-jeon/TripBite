'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Check, MailOpen } from 'lucide-react';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { Button, ButtonGrid } from '@/components/ui';
import { Skeleton } from '@/components/feedback/Skeleton';
import styles from './LetterSentClient.module.scss';

/**
 * [FUTURE: BE(NestJS) 연동 시 처리 포인트]
 *
 * 현재 lastSent 는 letter-store 의 in-memory state. reload 시 사라지면
 * `/letter/sent` 직접 진입은 `noLastSent` 안내로 떨어짐.
 *
 * BE 연동 시:
 *   - 보낼 때 `POST /letters` 응답으로 `letterId / recipientNickname /
 *     deliveredAt / receivedAt` 받아옴 → store 에 넣지 말고 `?id=` 로 전달.
 *   - `useLetter(id)` 로 결과 페이지에서 다시 fetch (reload/공유 대비).
 *   - 닉네임 해시 / formatKoreanDate / etaText 는 서버 응답값으로 대체.
 *   - store 의 lastSent 자체를 제거하고 mutation onSuccess → router.replace 패턴.
 *
 * 정책 [[rendering-speed-first]]: sent 페이지 진입 시 추가 prefetch 없이,
 *   isLoading → Skeleton 으로 letter card 자리만 잡아두고 fetch 완료 시 채움.
 */

/**
 * /letter/sent — 보낸 편지 결과 화면
 *
 *   ┌──────────────────────────────────────┐
 *   │  ✉️ 전송이 완료됐어요                │  상단 알림
 *   ├──────────────────────────────────────┤
 *   │  ┌──────────────────────────┐        │
 *   │  │ From                  ┌──┐│        │  익명 닉네임 + 지역 + 우표
 *   │  │ 익명의 여행자          │우표││       │
 *   │  │ 충북 청주시           └──┘│       │
 *   │  ├──────────────────────────┤        │
 *   │  │   고 마 워 요              │        │  메시지 + 보낸 날짜
 *   │  │   2026.05.29 14:35       │        │
 *   │  ├──────────────────────────┤        │
 *   │  │ To                       │        │
 *   │  │ 익명의 여행자 님에게      │        │  익명 수신자 + 추상 도착
 *   │  │ 랜덤 시간에 도착해요 ✓전송│        │
 *   │  └──────────────────────────┘        │
 *   ├──────────────────────────────────────┤
 *   │ [또 쓰기]   [홈으로]                 │
 *   └──────────────────────────────────────┘
 */

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export function LetterSentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const letterId = searchParams.get('id');
  const t = useTranslations('letter.sent');
  const tAuthor = useTranslations('letter.author');
  const lastSent = useLetterStore((s) => s.lastSent);

  // ?id= deep-link 우선 — 새로고침 / 공유 진입 대응. 없으면 store fallback.
  const letterQuery = useLetter(letterId ?? '');
  const enabled = !!letterId;
  const serverLetter = enabled ? letterQuery.data : undefined;

  // 통합 source — server 우선, store fallback.
  const view: { body: string; sentAt: string; location: string } | null =
    serverLetter
      ? {
          body: serverLetter.body,
          sentAt: serverLetter.createdAt,
          location: serverLetter.author.location ?? '익명 위치',
        }
      : lastSent
        ? {
            body: lastSent.body,
            sentAt: lastSent.sentAt,
            location: lastSent.location?.label ?? '익명 위치',
          }
        : null;

  if (enabled && letterQuery.isLoading && !lastSent) {
    return (
      <div className={styles.wrap}>
        <Skeleton width="100%" height={64} radius="lg" />
        <Skeleton width="100%" height={320} radius="lg" />
        <Skeleton width="100%" height={56} radius="md" />
      </div>
    );
  }

  if (enabled && letterQuery.isError && !lastSent) {
    return (
      <div className={styles.empty}>
        <p>{t('loadError')}</p>
        <ButtonGrid gap="md">
          <Button variant="secondary" onClick={() => letterQuery.refetch()}>
            {t('retry')}
          </Button>
          <Button
            variant="primary"
            onClick={() => router.replace('/letter/compose')}
          >
            {t('goCompose')}
          </Button>
        </ButtonGrid>
      </div>
    );
  }

  if (!view) {
    return (
      <div className={styles.empty}>
        <p>{t('empty')}</p>
        <Button
          variant="primary"
          onClick={() => router.replace('/letter/compose')}
        >
          {t('goCompose')}
        </Button>
      </div>
    );
  }

  // 수신자/도착시간은 BE 가 결정 (작성 후 15~60분 랜덤 매칭). 보낸 화면에선
  // 사용자에게 수신자 정보 노출 X (익명 보장), 도착 시간도 추상 표현.
  const senderLocation = view.location;

  const handleAgain = () => router.replace('/letter/compose');
  const handleHome = () => router.replace('/');

  return (
    <div className={styles.wrap}>
      {/* 1) 전송 알림 */}
      <header className={styles.notice} role="status">
        <span className={styles.noticeIcon} aria-hidden>
          <MailOpen size={20} />
        </span>
        <div>
          <p className={styles.noticeTitle}>{t('noticeTitle')}</p>
          <p className={styles.noticeBody}>{t('noticeBody')}</p>
        </div>
      </header>

      {/* 2) 편지 카드 */}
      <article className={styles.letter} aria-label={t('letterAria')}>
        {/* From */}
        <section className={styles.from}>
          <p className={styles.label}>{t('from')}</p>
          <div className={styles.fromRow}>
            <div>
              <p className={styles.author}>{tAuthor('anonymous')}</p>
              <p className={styles.fromLocation}>{senderLocation}</p>
            </div>
            <div className={styles.stamp} aria-hidden>
              <span className={styles.stampEmoji}>✉︎</span>
              <span className={styles.stampTag}>STAMP</span>
            </div>
          </div>
        </section>

        {/* Message — 5칸 박스 + 좌측 하단 날짜 */}
        <section className={styles.message}>
          <div className={styles.pinBoxes} aria-label={view.body}>
            {Array.from({ length: 5 }).map((_, i) => {
              const ch = Array.from(view.body)[i] ?? '';
              return (
                <div
                  key={i}
                  className={`${styles.pinCell} ${ch ? styles.pinFilled : ''}`}
                >
                  {ch && <span className={styles.pinChar}>{ch}</span>}
                </div>
              );
            })}
          </div>
          <p className={styles.date}>{formatKoreanDate(view.sentAt)}</p>
        </section>

        {/* To — 2줄 + 전송완료 배지 */}
        <section className={styles.to}>
          <p className={styles.label}>{t('to')}</p>
          <div className={styles.toRow}>
            <div className={styles.toLines}>
              <p className={styles.toLine1}>{t('toRecipient')}</p>
              <p className={styles.toLine2}>{t('toArrival')}</p>
            </div>
            <span className={styles.status} aria-label={t('sentBadge')}>
              <Check size={14} aria-hidden />
              {t('sentBadge')}
            </span>
          </div>
        </section>
      </article>

      {/* 3) 액션 */}
      <ButtonGrid gap="md">
        <Button variant="secondary" fullWidth onClick={handleAgain}>
          {t('again')}
        </Button>
        <Button variant="primary" fullWidth onClick={handleHome}>
          {t('home')}
        </Button>
      </ButtonGrid>
    </div>
  );
}
