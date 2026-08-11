'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/feedback/Skeleton';
import { Icon } from '@/components/icon';
import { Button, ButtonGrid } from '@/components/ui';
import { LetterPaper } from '@/features/letter/components/LetterPaper';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { useAuthStore } from '@/stores/auth-store';
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
  // 시안 도장에는 보낸 사람(=나) 의 닉네임이 찍힌다.
  const myNickname = useAuthStore((s) => s.user?.nickname);

  // ?id= deep-link 우선 — 새로고침 / 공유 진입 대응. 없으면 store fallback.
  const letterQuery = useLetter(letterId ?? '');
  const enabled = !!letterId;
  const serverLetter = enabled ? letterQuery.data : undefined;

  /**
   * 통합 source — server 우선, store fallback.
   *
   * `senderName` 은 익명 발송 여부에 따라 갈린다:
   *   server 응답이 있으면 → author.nickname (서버가 익명 처리까지 끝낸 값)
   *   없으면              → lastSent.isAnonymous ? "익명의 여행자" : 내 닉네임
   * 익명을 선택하지 않았는데 "익명의 여행자" 로 찍히던 버그를 고친 부분이다.
   */
  const view: {
    body: string;
    sentAt: string;
    location: string;
    senderName: string;
  } | null = serverLetter
    ? {
        body: serverLetter.body,
        sentAt: serverLetter.createdAt,
        location: serverLetter.author.location ?? '익명 위치',
        senderName: serverLetter.author.nickname || tAuthor('anonymous'),
      }
    : lastSent
      ? {
          body: lastSent.body,
          sentAt: lastSent.sentAt,
          location: lastSent.location?.label ?? '익명 위치',
          senderName: lastSent.isAnonymous
            ? tAuthor('anonymous')
            : (myNickname ?? tAuthor('anonymous')),
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

  // 시안 발송완료에는 "또 쓰기" 버튼이 없다 — 하단은 홈으로 가기 하나뿐.
  const handleHome = () => router.replace('/');

  return (
    <div className={styles.wrap}>
      {/* Figma `편지 발송완료` — 84 원 + 36 letter 아이콘 + 제목/보조 (중앙) */}
      <header className={styles.sentHead} role="status">
        <span className={styles.sentCircle} aria-hidden>
          <Icon name="check-36" size={36} />
        </span>
        <span className={styles.sentText}>
          <span className={styles.sentTitle}>{t('noticeTitle')}</span>
          <span className={styles.sentBody}>{t('noticeBody')}</span>
        </span>
      </header>

      {/* 시안 `편지 발송완료` — 사진 옆이 To(우측 정렬), 하단이 From.
          도장 아래는 보낸이 닉네임이 아니라 서비스명 고정 (stampSub). */}
      <LetterPaper
        ariaLabel={t('letterAria')}
        postmarkLabel={t('sentBadge')}
        postmarkName={t('stampSub')}
        topLabel={t('to')}
        topName={t('toRecipient')}
        body={view.body}
        bottomLabel={t('from')}
        bottomName={`${view.senderName} · ${senderLocation}`}
        dateText={`${formatKoreanDate(view.sentAt)} ${t('sentSuffix')}`}
        align="right"
      />

      {/* 시안은 하단에 라인 버튼 하나 (홈으로 가기) */}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        className={styles.lineButton}
        onClick={handleHome}
      >
        {t('home')}
      </Button>
    </div>
  );
}
