'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Illustration } from '@/components/brand/Illustration';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon';
import { Button, DestinationCard, PageSection } from '@/components/ui';
import { categoryEmoji } from '@/constants/emoji-map';
import { travelTypeIllustration } from '@/constants/illustration-map';
import { CHUNGBUK_REGIONS, type RegionCode } from '@/constants/regions';
import {
  TRAVEL_TYPE_CATEGORY,
  TRAVEL_TYPE_MATCH,
  TRAVEL_TYPE_META,
} from '@/constants/travel-types';
import { Carousel } from '@/features/carousel';
import {
  useMyTravelType,
  useRecommendedDestinations,
  useSetMyTravelType,
} from '@/features/ranking/hooks/use-ranking';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { useShareCard } from '@/hooks/use-share-card';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import type { TravelTypeCode, TravelTypeDto } from '@/types/api-domain';
import styles from './TravelTypeResult.module.scss';

/**
 * 여행 유형 결과 화면 — Figma `TST · 유형테스트 결과` (3413:4659) 실측 정합.
 *
 *   body padding 20 / V gap 20
 *   ├ banner 320x247 : #EAF6EF + 1px #00B334, r12, padding 28/22/24/22
 *   │   typeTextResultItem (V gap 16) — 52 일러스트 → code pill → 24 Bold 제목
 *   │   → 태그 pill 행 → 14 Regular 설명(가운데)
 *   ├ section "이런 여행지가 어울려요" : 152x168 카드 가로 스크롤 (gap 8)
 *   ├ match-section "여행 궁합" : 흰 카드(padding 0/16) 안 2행(각 86)
 *   │   40 원 + [라벨 10 / 유형명 14 Bold / 이유 10 Medium]
 *   └ buttons : [다시 테스트 | 이미지 카드 공유] + [내 유형으로 저장]
 *
 * 데이터: useMyTravelType(GET /me.travelType). 추천 여행지는 BE 미제공이라
 * 유형→카테고리 매핑으로 /destinations/random 을 쓴다(TRAVEL_TYPE_CATEGORY).
 * 궁합은 TRAVEL_TYPE_MATCH (FE 고정 콘텐츠).
 */
function regionLabelFor(code: RegionCode): string {
  return CHUNGBUK_REGIONS.find((r) => r.code === code)?.ko ?? code;
}

export function TravelTypeResult() {
  const t = useTranslations('travelType.result');
  const router = useRouter();
  const { data, isLoading } = useMyTravelType();
  const applyMutation = useSetMyTravelType();
  const requireAuth = useRequireAuth();
  const shareCard = useShareCard();

  const code = data?.code;
  const match = code ? TRAVEL_TYPE_MATCH[code] : null;
  // 시안은 카드 3장인데 `GET /destinations/random` 은 토너먼트 풀 겸용이라
  // size<4 면 409 TOURNAMENT_POOL_TOO_SMALL 이다(실측). 4장 받아 3장만 쓴다.
  const recommended = useRecommendedDestinations(
    4,
    code ? TRAVEL_TYPE_CATEGORY[code] : undefined,
  );

  const handleApply = (result: TravelTypeDto) => {
    haptic.tap();
    void requireAuth(
      () =>
        applyMutation.mutate(result.code, {
          onSuccess: () => toast.success(t('appliedSuccess')),
          onError: () => toast.error(t('appliedFailed')),
        }),
      { reason: t('applyRequireAuth') },
    );
  };

  // file 단독 — title/text 동반 시 일부 share target (카카오톡 등) 이 텍스트만
  // 클립보드로 분리 처리하고 file 첨부 흐름이 끊긴다.
  const handleShare = (result: TravelTypeDto) => {
    haptic.tap();
    const best = TRAVEL_TYPE_MATCH[result.code].best;
    const params = new URLSearchParams({
      // `code` — OG 라우트의 동적 세그먼트가 `[type]` 이라 `type` 은 충돌한다
      code: result.code,
      name: result.title,
      ...(result.description ? { tagline: result.description } : {}),
      // 시안 공유 카드는 태그 pill 3개와 "환상의 짝꿍 · N" 줄까지 포함한다
      keywords: (result.tags ?? []).join(','),
      bestTitle: TRAVEL_TYPE_META[best.code].title,
    });
    return shareCard({
      imageUrl: `/api/og/quiz?${params.toString()}`,
      filename: `tripbite-traveltype-${result.code}.png`,
    });
  };

  if (isLoading) {
    return <div className={styles.fallback}>{t('loading')}</div>;
  }
  if (!data) {
    return (
      <EmptyState
        icon={<Icon name="compass" size={28} />}
        title={t('empty')}
        description={t('emptyHint')}
        action={
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
          >
            {t('startTest')}
          </Button>
        }
      />
    );
  }

  const result: TravelTypeDto = data;
  const resultArt = travelTypeIllustration(result.code);
  const tags = result.tags ?? [];
  const recItems = (recommended.data ?? []).slice(0, 3);

  return (
    <div className={styles.wrap}>
      {/* Figma `banner` — 연초록 면 + 초록 1px, 안쪽이 typeTextResultItem */}
      <section className={styles.banner} aria-label={result.title}>
        <div className={styles.typeBlock}>
          <div className={styles.typeHead}>
            <div className={styles.iconWrap} aria-hidden>
              {resultArt ? (
                <Illustration name={resultArt} size={52} />
              ) : (
                <span className={styles.emojiFallback}>{result.emoji}</span>
              )}
            </div>
            <span className={styles.codePill}>{result.code}</span>
          </div>
          <h2 className={styles.title}>{result.title}</h2>
          {tags.length > 0 && (
            <ul className={styles.tags} aria-label={t('keywordsAria')}>
              {tags.map((k) => (
                <li key={k} className={styles.tag}>
                  {k}
                </li>
              ))}
            </ul>
          )}
          {result.description && (
            <p className={styles.description}>{result.description}</p>
          )}
        </div>
      </section>

      {/* Figma `section` — 152 카드 가로 스크롤. 유형별 추천이 BE 에 없어
          카테고리 필터(random)로 채운다. 비면 섹션 자체를 접는다. */}
      {recItems.length > 0 && (
        <PageSection title={t('recommendTitle')}>
          <div className={styles.bleedRight}>
            <Carousel
              slides={recItems}
              renderSlide={(item) => {
                const d = item.destination;
                const region = regionLabelFor(d.region as RegionCode);
                return (
                  <DestinationCard
                    href={{ pathname: `/destination/${d.id}` }}
                    imageUrl={d.imageUrl}
                    emoji={categoryEmoji(d.category)}
                    regionLabel={region}
                    name={d.name}
                    ariaLabel={`${d.name} · ${region}`}
                  />
                );
              }}
              keyExtractor={(item) => item.destination.id ?? String(item.rank)}
              options={{ slidesPerView: 2, slideWidth: 152, gap: 8 }}
              showDots={false}
              fallbackHeight={168}
              ariaLabel={t('recommendTitle')}
            />
          </div>
        </PageSection>
      )}

      {/* Figma `match-section` — 잘 맞는 / 잘 안 맞는 유형 두 행 */}
      {match && (
        <PageSection title={t('compatibility.title')}>
          <ul className={styles.matchBox}>
            <MatchRow
              tone="best"
              label={t('compatibility.bestLabel')}
              code={match.best.code}
              reason={match.best.reason}
            />
            <MatchRow
              tone="worst"
              label={t('compatibility.worstLabel')}
              code={match.worst.code}
              reason={match.worst.reason}
            />
          </ul>
        </PageSection>
      )}

      {/* Figma `buttons` — 2단 행(다시 테스트 / 이미지 카드 공유) + 저장 */}
      <div className={styles.actions}>
        <div className={styles.actionRow}>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              haptic.tap();
              router.replace('/quiz');
            }}
          >
            {t('retake')}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleShare(result)}
            leadingIcon={<Icon name="share-18" size={18} />}
          >
            {t('share')}
          </Button>
        </div>
        <Button
          variant="primary"
          fullWidth
          onClick={() => handleApply(result)}
          loading={applyMutation.isPending}
        >
          {t('apply')}
        </Button>
      </div>
    </div>
  );
}

/** Figma `recent-row` — 40 원형 일러스트 + 라벨/유형명/이유 */
function MatchRow({
  tone,
  label,
  code,
  reason,
}: {
  tone: 'best' | 'worst';
  label: string;
  code: TravelTypeCode;
  reason: string;
}) {
  const meta = TRAVEL_TYPE_META[code];
  const art = travelTypeIllustration(code);
  return (
    <li className={styles.matchRow}>
      <span
        className={`${styles.matchIcon} ${tone === 'worst' ? styles.matchIconWorst : ''}`}
        aria-hidden
      >
        {art ? <Illustration name={art} size={24} /> : meta.emoji}
      </span>
      <span className={styles.matchBody}>
        <span
          className={`${styles.matchLabel} ${tone === 'best' ? styles.matchLabelBest : ''}`}
        >
          {label}
        </span>
        <span className={styles.matchTitle}>{meta.title}</span>
        <span className={styles.matchReason}>{reason}</span>
      </span>
    </li>
  );
}
