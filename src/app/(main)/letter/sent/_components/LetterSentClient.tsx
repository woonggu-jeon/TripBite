'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Send, User } from 'lucide-react';
import { useLetter } from '@/features/letter/hooks/use-letters';
import { useLetterStore } from '@/features/letter/store/letter-store';
import { useMe } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui';
import { Skeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { secureImageUrl } from '@/lib/secure-image-url';
import styles from './LetterSentClient.module.scss';

/**
 * /letter/sent — Figma "편지 발송완료" (2026-06-24 재정합).
 *
 * 의미 변경 (사용자 명시):
 *   - **top meta = To (수신자)** — 랜덤 수신자에게 / 전달 예정.
 *   - **bottom footer = From (발신자 = 본인)** — 익명/닉네임 · 지역, yyyy.MM.dd 발송.
 *   - sq (좌상단 우표) — 내 프로필 이미지 (avatarUrl) 또는 User icon fallback.
 *   - pm (도장) — "발송완료\n여행한입" 멀티라인.
 *   - button — "홈으로 가기" → /.
 *
 * 익명 발송 (isAnonymous true) 시: from 표시 = "익명의 여행자 · {지역}".
 * 일반 발송 시: from 표시 = "{내 닉네임} · {지역}".
 */

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function LetterSentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const letterId = searchParams.get('id');
  const t = useTranslations('letter.sent');
  const lastSent = useLetterStore((s) => s.lastSent);
  const { data: me } = useMe();

  const letterQuery = useLetter(letterId ?? '');
  const enabled = !!letterId;
  const serverLetter = enabled ? letterQuery.data : undefined;

  const view: {
    body: string;
    sentAt: string;
    location: string;
    isAnonymous: boolean;
  } | null = serverLetter
    ? {
        body: serverLetter.body,
        sentAt: serverLetter.createdAt,
        location: serverLetter.author.location ?? '',
        // server letter author.nickname 이 빈 문자열 또는 "익명" 마커일 때
        // 익명으로 간주 — BE spec 확정 시 정합.
        isAnonymous: !serverLetter.author.nickname,
      }
    : lastSent
      ? {
          body: lastSent.body,
          sentAt: lastSent.sentAt,
          location: lastSent.location?.label ?? '',
          isAnonymous: !!lastSent.isAnonymous,
        }
      : null;

  if (enabled && letterQuery.isLoading && !lastSent) {
    return (
      <div className={styles.wrap}>
        <div className={styles.wb}>
          <div className={styles.skeletonHero}>
            <Skeleton width={72} height={72} radius="full" />
            <Skeleton width="60%" height={31} radius="sm" />
            <Skeleton width="80%" height={20} radius="sm" />
          </div>
          <Skeleton width="100%" height={292} radius="lg" />
        </div>
      </div>
    );
  }

  if (enabled && letterQuery.isError && !lastSent) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          variant="hero"
          icon={<Send size={36} strokeWidth={2.7} aria-hidden />}
          title={t('loadError')}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => letterQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!view) {
    return (
      <div className={styles.wrap}>
        <EmptyState
          variant="hero"
          icon={<Send size={36} strokeWidth={2.7} aria-hidden />}
          title={t('empty')}
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => router.replace('/letter/compose')}
            >
              {t('goCompose')}
            </Button>
          }
        />
      </div>
    );
  }

  const handleHome = () => router.replace('/');
  const date = formatKoreanDate(view.sentAt);
  const myNickname = me?.nickname ?? '';
  // From: 본인 닉네임 또는 익명 + 지역.
  const fromName = view.isAnonymous
    ? t('fromAnonymous')
    : myNickname || t('fromAnonymous');
  const fromLine = view.location ? `${fromName} · ${view.location}` : fromName;
  const avatarSrc = secureImageUrl(me?.avatarUrl);

  return (
    <div className={styles.wrap}>
      <div className={styles.wb}>
        {/* Figma Frame 7 hero. */}
        <div className={styles.hero}>
          <span className={styles.circle} aria-hidden>
            <Send size={36} strokeWidth={2.7} />
          </span>
          <div className={styles.headings}>
            <h1 className={styles.title}>{t('noticeTitle')}</h1>
            <p className={styles.sub}>{t('noticeBody')}</p>
          </div>
        </div>

        {/* Figma Frame 79 — sent letter card. */}
        <article className={styles.card} aria-label={t('letterAria')}>
          {/* top: sq (내 프로필) + 도장 + meta (To = 수신자). */}
          <div className={styles.top}>
            <div className={styles.pw} aria-hidden>
              <span className={styles.sq}>
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt=""
                    fill
                    sizes="60px"
                    className={styles.sqImage}
                  />
                ) : (
                  <User
                    size={28}
                    strokeWidth={1.6}
                    className={styles.sqIcon}
                    aria-hidden
                  />
                )}
              </span>
              {/* Figma pm — "발송완료\n여행한입" 멀티라인 도장. */}
              <span className={styles.pm}>
                <span className={styles.pmMain}>{t('stampMain')}</span>
                <span className={styles.pmSub}>{t('stampSub')}</span>
              </span>
            </div>
            <div className={styles.meta}>
              <span className={styles.metaLabel}>{t('to')}</span>
              <span className={styles.metaName}>{t('toRecipient')}</span>
              <span className={styles.metaLoc}>{t('toDelivery')}</span>
            </div>
          </div>

          {/* Figma ms (padding 20) > Frame 71 (padding 12 0 + border-y error)
              > Frame 70 (border-y error + 5 cells) — 이중 border + 12 gap.
              직전 단일 border 만 → Figma 우표 천공 효과 정합 (사용자 명시
              2026-06-24). */}
          <div className={styles.ms}>
            <div className={styles.cellsOuter}>
              <div className={styles.cells}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const ch = Array.from(view.body)[i] ?? '';
                  return (
                    <div key={i} className={styles.cell}>
                      {ch && <span className={styles.cellChar}>{ch}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.div} aria-hidden />

          {/* Figma Frame 80 — From (발신자 = 본인) + 발송 날짜. */}
          <div className={styles.footer}>
            <div className={styles.footerRow}>
              <span className={styles.footerStar}>{t('from')}</span>
              <span className={styles.footerLabel}>{fromLine}</span>
            </div>
            <span className={styles.footerNote}>
              {date} {t('dateLabel')}
            </span>
          </div>
        </article>
      </div>

      {/* Figma button absolute bottom 20 — 320×52 outline primary M_16:
          white bg + 1px primary border + primary color + radius 12.
          variant=outlinePrimary (primary border) + size=lg (52h, radius 12). */}
      <div className={styles.actions}>
        <Button
          variant="outlinePrimary"
          size="lg"
          fullWidth
          onClick={handleHome}
        >
          {t('goHome')}
        </Button>
      </div>
    </div>
  );
}
