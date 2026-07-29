import { ImageResponse } from 'next/og';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { destinationSeeds } from '@/mocks/seeds/destinations';
import { regionContentSeeds } from '@/mocks/seeds/regions';

/**
 * 결과 이미지 카드 — Next.js ImageResponse(Satori) 기반.
 *
 * 사용 흐름:
 *   - 클라이언트가 결과 데이터를 query 로 인코딩해 호출:
 *     /api/og/tournament?winner=수암골&region=cheongju&category=attraction&matches=4
 *   - 응답: 1080×1080 PNG. CDN/Edge 캐시 friendly (`s-maxage=86400`).
 *   - 클라이언트가 Blob 으로 받아 Web Share API File 로 OS sheet 공유.
 *
 * deep-link 와 무관 — 받는 쪽은 이미지 파일만 받음. BE / DB 영구 저장 불필요.
 *
 * Satori 규칙:
 *   - 모든 div 에 `display` 명시 (block 미지원). 자식이 단일 string 이라도 flex.
 *   - text 는 inline span 으로 감싸는 게 가장 안전.
 *   - padding/margin short notation 도 지원하지만 호환성 위해 개별 속성으로.
 *   - 이모지는 Satori 가 Twemoji SVG 자동 fetch.
 *
 * 폰트:
 *   - Pretendard Bold woff 를 jsdelivr 에서 fetch (Edge instance 재사용 캐시).
 *   - 실패 시 sans-serif fallback (한글 일부 깨질 수 있지만 라우트 500 보다는 우선).
 *
 * 카드 디자인은 미니멀 기본형. 추후 디자이너 시안 받으면 JSX 만 교체.
 */
export const runtime = 'edge';

let cachedFont: ArrayBuffer | null | undefined;
async function getPretendard(): Promise<ArrayBuffer | null> {
  if (cachedFont !== undefined) return cachedFont;
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/woff/Pretendard-Bold.woff',
      { cache: 'force-cache' },
    );
    if (!res.ok) {
      cachedFont = null;
      return null;
    }
    cachedFont = await res.arrayBuffer();
    return cachedFont;
  } catch {
    cachedFont = null;
    return null;
  }
}

const REGION_KO: Record<string, string> = {
  cheongju: '청주시',
  chungju: '충주시',
  jecheon: '제천시',
  danyang: '단양군',
  boeun: '보은군',
  okcheon: '옥천군',
  yeongdong: '영동군',
  jincheon: '진천군',
  goesan: '괴산군',
  eumseong: '음성군',
  jeungpyeong: '증평군',
};

const CATEGORY_KO: Record<string, string> = {
  local: '지역 명소',
  festival: '축제',
  attraction: '관광지',
  experience: '체험관광',
};

const CATEGORY_EMOJI: Record<string, string> = {
  local: '🏘️',
  festival: '🎪',
  attraction: '📍',
  experience: '🎨',
};

const TYPE_EMOJI: Record<string, string> = {
  adventurer: '🧗',
  explorer: '🗺️',
  relaxer: '🌿',
  foodie: '🍴',
};

const SIZE = 1080;
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
};

type Params = { params: Promise<{ type: string }> };

export async function GET(
  request: Request,
  { params }: Params,
): Promise<Response> {
  const { type } = await params;
  const { searchParams } = new URL(request.url);

  const validTypes = [
    'tournament',
    'quiz',
    'destination',
    'region',
    'master',
  ] as const;
  type OgType = (typeof validTypes)[number];
  if (!(validTypes as readonly string[]).includes(type)) {
    return new Response('Not found', { status: 404 });
  }

  const fontData = await getPretendard();

  try {
    const ogType = type as OgType;
    switch (ogType) {
      case 'tournament':
        return renderTournament(searchParams, fontData);
      case 'quiz':
        return renderQuiz(searchParams, fontData);
      case 'destination':
        return renderDestination(searchParams, fontData);
      case 'region':
        return renderRegion(searchParams, fontData);
      case 'master':
        return renderMaster(searchParams, fontData);
      default: {
        // exhaustive guard — OgType 확장 시 신규 case 누락 catch.
        const _exhaustive: never = ogType;
        return new Response(`unknown og type: ${_exhaustive as string}`, {
          status: 400,
        });
      }
    }
  } catch (err) {
    // Satori 가 unsupported CSS / 누락 element 만나면 throw.
    // 500 대신 명확한 메시지로 — dev console 디버깅 용이.
    const message = err instanceof Error ? err.message : 'render failed';
    return new Response(`og render error: ${message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

type ImageInit = ConstructorParameters<typeof ImageResponse>[1];

function makeInit(
  fontData: ArrayBuffer | null,
  size: { width: number; height: number } = { width: SIZE, height: SIZE },
): ImageInit {
  const init: ImageInit = {
    width: size.width,
    height: size.height,
    headers: CACHE_HEADERS,
  };
  if (fontData) {
    init.fonts = [
      {
        name: 'Pretendard',
        data: fontData,
        weight: 700,
        style: 'normal',
      },
    ];
  }
  return init;
}

/**
 * Figma "TRN · 결과 공유 카드" 정합 (2026-06-24) — 360×500 spec × 3 scale →
 * 1080×1500 PNG. 모든 px = Figma 360 spec × 3.
 *
 * 구성:
 *   - box 1080×1500 primary bg radius 72 padding 132/96/84 (44/32/28 ×3) column center.
 *   - trophy circle 252 (84×3) white opacity 0.18 + Trophy 120 (~42×3) white.
 *   - sp 66 (22×3).
 *   - eyebrow Inter ExtraBold 37.5 (12.5×3) ls 0.14em white opacity 0.9 "나의 우승 여행지".
 *   - sp 30 (10×3).
 *   - title Inter ExtraBold 90 (30×3) line 108 ls -0.04em white "{winner}".
 *   - sp 24 (8×3).
 *   - meta Inter Medium 40.5 (13.5×3) white opacity 0.92 "{region} · {category}".
 *   - sp 54 (18×3).
 *   - description Inter Regular 40.5 line 160% white opacity 0.9 max-width 888 (296×3).
 *   - grow space.
 *   - match-badge 471×96 (157×32 ×3) padding 24 54 (8/18 ×3) white opacity 0.16
 *     + Inter Bold 40.5 white "총 N매치 끝의 우승 🏆".
 *   - sp 60 (20×3).
 *   - footer row gap 18 (6×3): BrandLogo 54 (18×3) + Inter ExtraBold 39 (13×3)
 *     ls -0.02em white "여행 한입".
 *
 * Query: winner / region / category / matches / desc.
 */
function renderTournament(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const winner = q.get('winner') ?? '여행지';
  const regionCode = q.get('region') ?? '';
  const region = REGION_KO[regionCode] ?? regionCode;
  const category = q.get('category') ?? '';
  const categoryLabel = CATEGORY_KO[category] ?? '';
  const matches = q.get('matches');
  const desc = q.get('desc') ?? '';
  const metaText =
    region && categoryLabel
      ? `${region} · ${categoryLabel}`
      : region || categoryLabel;
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Figma "TRN · 결과 공유 카드" (2026-06-25 재정합) — padding 40 20 20.
        paddingTop: 120,
        paddingLeft: 60,
        paddingRight: 60,
        paddingBottom: 60,
        // bg #EAF6EF (primary-soft) + radius 72 (24×3). 직전 primary fill
        // 회귀 정정.
        background: '#EAF6EF',
        borderRadius: 72,
        fontFamily,
      }}
    >
      {/* circle 88 (×3=264) white + Trophy 40 (×3=120) primary stroke 2.7 — 우승 trophy.
          Satori 가 svg path 지원 → Lucide Trophy outline. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 264,
          height: 264,
          background: '#FFFFFF',
          borderRadius: 999,
          marginBottom: 48,
        }}
      >
        <div style={{ display: 'flex', fontSize: 120, lineHeight: 1 }}>🏆</div>
      </div>

      {/* eyebrow — Body B_14_140% muted (Figma 명시 색 fg/muted 정합). */}
      <div
        style={{
          display: 'flex',
          fontSize: 42,
          fontWeight: 700,
          color: '#393939',
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        나의 우승 여행지
      </div>

      {/* title — B_24_130% fg (#151515) — winner. */}
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#151515',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        {winner}
      </div>

      {/* meta — Caption R_12 fg (#151515) — region 단독. */}
      {metaText && (
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            fontWeight: 400,
            color: '#151515',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            marginBottom: 60,
            textAlign: 'center',
          }}
        >
          {metaText}
        </div>
      )}

      {/* description — Caption R_12 fg (#151515) center 2 lines max. */}
      {desc && (
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            fontWeight: 400,
            color: '#151515',
            letterSpacing: '-0.01em',
            lineHeight: 1.4,
            marginBottom: 60,
            maxWidth: 888,
            textAlign: 'center',
          }}
        >
          {desc.length > 80 ? `${desc.slice(0, 80)}…` : desc}
        </div>
      )}

      {/* grow space — match line 을 아래쪽으로. */}
      <div style={{ display: 'flex', flex: 1 }} />

      {/* match line — Body B_14 fg plain text (직전 pill 회귀 → Figma 정합 plain). */}
      {matches && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 42,
            fontWeight: 700,
            color: '#151515',
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          총 {matches}매치 끝의 우승
        </div>
      )}

      {/* footer — BrandLogo + Title B_18 fg "여행 한입" (×3=54). bg #EAF6EF
          이므로 BrandLogo 기본색 (primary leaf + amber accent) 자연 노출. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginTop: 60,
        }}
      >
        <BrandLogo width={84} ariaHidden style={{ display: 'block' }} />
        <div
          style={{
            display: 'flex',
            fontSize: 54,
            fontWeight: 700,
            color: '#151515',
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          여행 한입
        </div>
      </div>
    </div>,
    makeInit(fontData, { width: 1080, height: 1260 }),
  );
}

/**
 * Figma "TST · 공유 이미지 카드" (2026-06-23) 정합 — 360×360 spec × 3 scale
 * (1080×1080 OG image). 모든 px Figma 360 spec × 3.
 *
 * 구성:
 *   - bg peach gradient #FFF4E6 → #FFFFFF 54% → #FCEAD3
 *   - emoji 52(×3=156) → code pill primary 73×20 → title B_24 → keyword pills
 *     secondary01 → description R_14 muted → 💚 match-line (best.title) →
 *     footer "여행 한입" Inter ExtraBold 13 primary (absolute bottom 20)
 *
 * Query:
 *   - type (code) / name / emoji / tagline (description) / keywords (csv) /
 *     bestTitle / bestEmoji — TravelTypeResult.handleShare 가 인코딩.
 */
function renderQuiz(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const typeCode = q.get('type') ?? '';
  const typeName = q.get('name') ?? '여행 유형';
  const tagline = q.get('tagline') ?? '';
  const emoji = q.get('emoji') ?? TYPE_EMOJI[typeCode] ?? '✨';
  const keywords = (q.get('keywords') ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const bestTitle = q.get('bestTitle') ?? '';
  const bestEmoji = q.get('bestEmoji') ?? '';
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: 60,
        // Figma "TST · 공유 이미지 카드" — bg #EAF6EF (secondary01) + 1px #C6C6C6
        // + radius 36 (12×3). 직전 peach gradient + 3px (검정 두꺼움) 정정
        // (사용자 명시 2026-06-25). 1px 도 ×3 = 3 가능하나 사용자가 검정처럼
        // 보인다고 명시 → border 자체 제거.
        background: '#EAF6EF',
        borderRadius: 36,
        fontFamily,
      }}
    >
      {/* emoji 52 → 156 */}
      <div style={{ display: 'flex', fontSize: 156, lineHeight: 1 }}>
        {emoji}
      </div>

      {/* code pill primary fill — Caption B_10 white */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 36,
          paddingRight: 36,
          background: '#00B334',
          borderRadius: 999,
          fontSize: 30,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {typeCode}
      </div>

      {/* title B_24_130% fg */}
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#151515',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          textAlign: 'center',
        }}
      >
        {typeName}
      </div>

      {/* keyword pills row — Figma 명시 bg #FFFFFF (직전 #EAF6EF 회귀 정정,
          사용자 명시 2026-06-25 정합). padding 4 12 ×3 = 12 36 (수직 12 ×3
          유지, 수평 36). */}
      {keywords.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 24,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {keywords.slice(0, 3).map((k) => (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'center',
                paddingTop: 12,
                paddingBottom: 12,
                paddingLeft: 36,
                paddingRight: 36,
                background: '#FFFFFF',
                borderRadius: 999,
                fontSize: 30,
                fontWeight: 700,
                color: '#00B334',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              {k}
            </div>
          ))}
        </div>
      )}

      {/* description R_14 muted center. Figma Regular 400 명시 정합. */}
      {tagline && (
        <div
          style={{
            display: 'flex',
            fontSize: 42,
            fontWeight: 400,
            color: '#393939',
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
            textAlign: 'center',
            maxWidth: 960,
          }}
        >
          {tagline}
        </div>
      )}

      {/* match-line — white pill 💚 + best.title Caption R_12 primary */}
      {bestTitle && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 36,
            paddingRight: 36,
            background: '#FFFFFF',
            borderRadius: 999,
          }}
        >
          <div style={{ display: 'flex', fontSize: 40.5, lineHeight: 1.185 }}>
            {bestEmoji || '💚'}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              color: '#00B334',
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
            }}
          >
            {bestTitle}
          </div>
        </div>
      )}

      {/* footer — absolute bottom 60 (Figma 20×3) center, brand logo (3 path
          vector) + "여행 한입" Inter ExtraBold 13 primary (×3 = 39). */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        {/* footer — master/tournament 와 동일 spec 통일 (사용자 명시 2026-06-25):
            BrandLogo 84 + Title B_18 fg (fontSize 54 / Bold 700 / #151515 /
            lineHeight 1.4). 직전 quiz 만 13ExtraBold primary 였던 회귀 정정. */}
        <BrandLogo width={84} ariaHidden style={{ display: 'block' }} />
        <div
          style={{
            display: 'flex',
            fontSize: 54,
            fontWeight: 700,
            color: '#151515',
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          여행 한입
        </div>
      </div>
    </div>,
    makeInit(fontData),
  );
}

/**
 * 여행지 상세 카드 — id 로 seed 에서 직접 정보 가져옴.
 * destinationSeeds 우선, 없으면 regionContentSeeds fallback (mock /destinations
 * 와 동일 정책). 둘 다 없으면 generic 카드.
 *
 * server-side import 라 mock service worker 거치지 않음 → deterministic.
 */
function renderDestination(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const id = q.get('id') ?? '';
  const seed = destinationSeeds.find((d) => d.id === id);
  const rc = !seed ? regionContentSeeds.find((r) => r.id === id) : null;

  const name = seed?.name ?? rc?.title ?? '여행지';
  const regionCode = seed?.region ?? rc?.region ?? '';
  const region = REGION_KO[regionCode] ?? regionCode;
  const category = (seed?.category ?? rc?.type ?? '') as string;
  const categoryLabel = CATEGORY_KO[category] ?? '';
  const emoji = CATEGORY_EMOJI[category] ?? '📍';
  const metaText =
    region && categoryLabel
      ? `${region} · ${categoryLabel}`
      : region || categoryLabel;
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #ecfdf5 0%, #ecfeff 100%)',
        paddingTop: 80,
        paddingRight: 80,
        paddingBottom: 80,
        paddingLeft: 80,
        fontFamily,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 32,
          color: '#71717a',
        }}
      >
        <span>📍 여행지</span>
        <span style={{ color: '#a1a1aa' }}>TripBite</span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 220,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          {emoji}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          {name}
        </div>
        {metaText && (
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              color: '#52525b',
              marginTop: 24,
            }}
          >
            {metaText}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: 28,
          color: '#a1a1aa',
        }}
      >
        충북 여행지 한 곳을 둘러보세요
      </div>
    </div>,
    makeInit(fontData),
  );
}

/**
 * 시군 상세 카드 — RegionCode 로 시군명 표시. 알 수 없는 code 면 generic.
 */
function renderRegion(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const code = q.get('code') ?? '';
  const meta = CHUNGBUK_REGIONS.find((r) => r.code === code);
  const name = meta?.ko ?? REGION_KO[code] ?? code ?? '충북';
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #fef3c7 0%, #fff7ed 100%)',
        paddingTop: 80,
        paddingRight: 80,
        paddingBottom: 80,
        paddingLeft: 80,
        fontFamily,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 32,
          color: '#71717a',
        }}
      >
        <span>🗺️ 시군 가이드</span>
        <span style={{ color: '#a1a1aa' }}>TripBite</span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 220,
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          🏞️
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            color: '#52525b',
            marginTop: 24,
          }}
        >
          충청북도
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: 28,
          color: '#a1a1aa',
        }}
      >
        관광지 · 축제 · 체험 한눈에
      </div>
    </div>,
    makeInit(fontData),
  );
}

/**
 * 충북 마스터 달성 카드 — Figma "MY · 마스터 카드" (2026-06-23) 정합.
 *
 * 모든 px = Figma 360 spec × 3 (1080×1080 OG image).
 *
 * 구성:
 *   - bg gradient #8DEF80 → #C5F5D9 (Figma 정확 정합).
 *   - 88 white circle + Trophy 44 primary (×3 = 264 circle + 132 trophy).
 *   - "CHUNGBUK MASTER" Bold 13 ls 0.16em opacity 0.9 (×3 = 39).
 *   - "충북 마스터" ExtraBold 30 ls -0.03em (×3 = 90).
 *   - msg-box white radius 12 padding 20 18 + Medium 14 line 170% muted center
 *     (×3 = radius 36, padding 60 54, font 42).
 *   - footer brand row — BrandLogo + "여행한입" Bold 18 primary (×3 = 54).
 *
 * Query:
 *   - count (optional) — 보통 11.
 */
function renderMaster(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const count = Number(q.get('count') ?? 11);
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Figma padding 40 20 20 (×3) — top 120 / 좌우 60 / bottom 60.
        paddingTop: 120,
        paddingLeft: 60,
        paddingRight: 60,
        paddingBottom: 60,
        // Figma "MY · 마스터 카드" — bg #EAF6EF (secondary01) + radius 60 (20×3).
        // 직전 gradient + 3px C6C6C6 border (검정처럼 보임) → 명시 정합 (사용자
        // 명시 2026-06-25).
        background: '#EAF6EF',
        borderRadius: 60,
        fontFamily,
      }}
    >
      {/* iconCircle 88 (×3=264) white + Trophy 44 (×3=132) primary. Frame 22
          gap 16 (×3=48) — icon ↔ subtitle. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 264,
          height: 264,
          background: '#FFFFFF',
          borderRadius: 999,
          marginBottom: 48,
        }}
      >
        <div style={{ display: 'flex', fontSize: 132, lineHeight: 1 }}>🏆</div>
      </div>

      {/* subtitle "CHUNGBUK MASTER" — Figma Body B_14_140% fg (Bold 14
          ×3=42, ls -0.02em). 직전 39 + 0.16em 회귀 정정 (2026-06-25). */}
      <div
        style={{
          display: 'flex',
          fontSize: 42,
          fontWeight: 700,
          color: '#151515',
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        CHUNGBUK MASTER
      </div>

      {/* title "충북 마스터" — Figma Title B_24_130% fg (Bold 24 ×3=72).
          직전 ExtraBold 30 (×3=90) 회귀 정정 (2026-06-25 — Bold 700, 72px). */}
      <div
        style={{
          display: 'flex',
          fontSize: 72,
          fontWeight: 700,
          color: '#151515',
          letterSpacing: '-0.02em',
          lineHeight: 1.3,
          marginBottom: 72,
          textAlign: 'center',
        }}
      >
        충북 마스터
      </div>

      {/* msg-box white radius 12 padding 20 16 + 1px #E0E0E0 border + Medium
          14 170% muted center. Frame 24 gap 20 (×3=60). Figma border 누락
          정정 (2026-06-25). */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          paddingTop: 60,
          paddingBottom: 60,
          paddingLeft: 48,
          paddingRight: 48,
          background: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: 36,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            fontSize: 42,
            fontWeight: 500,
            color: '#393939',
            lineHeight: 1.7,
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          충북 {count}개 시군 도장 모두 완료
        </div>
      </div>

      {/* brand row — BrandLogo + "여행 한입" Title B_18 (×3 = 54) primary.
          Figma Frame 6 row gap 4 (×3=12) center. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <BrandLogo width={84} ariaHidden style={{ display: 'block' }} />
        <div
          style={{
            display: 'flex',
            fontSize: 54,
            fontWeight: 700,
            color: '#151515',
            letterSpacing: '-0.02em',
            lineHeight: 1.4,
          }}
        >
          여행 한입
        </div>
      </div>
    </div>,
    makeInit(fontData),
  );
}
