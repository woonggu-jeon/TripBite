import { ImageResponse } from 'next/og';
import { destinationSeeds } from '@/mocks/seeds/destinations';
import { regionContentSeeds } from '@/mocks/seeds/regions';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import { BrandLogo } from '@/components/ui/BrandLogo';

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
        // padding 44 32 28 (Figma 360 spec) → ×3 = 132 / 96 / 84.
        paddingTop: 132,
        paddingLeft: 96,
        paddingRight: 96,
        paddingBottom: 84,
        // primary bg + radius 72 (24×3). 1080×1500 PNG 사각형이므로 radius 는
        // 시각적으로 안 보이지만 spec 일관성 위해 명시.
        background: '#00B334',
        borderRadius: 72,
        fontFamily,
      }}
    >
      {/* trophy circle 252 (84×3) white opacity 0.18 + emoji 120 (~42×3) white. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 252,
          height: 252,
          background: 'rgba(255, 255, 255, 0.18)',
          borderRadius: 999,
        }}
      >
        <div style={{ display: 'flex', fontSize: 132, lineHeight: 1 }}>🏆</div>
      </div>

      {/* eyebrow — sp 66 (22×3) 위. Inter ExtraBold 37.5 ls 0.14em white 0.9. */}
      <div
        style={{
          display: 'flex',
          fontSize: 37.5,
          fontWeight: 800,
          color: 'rgba(255, 255, 255, 0.9)',
          letterSpacing: '0.14em',
          lineHeight: 1.2,
          marginTop: 66,
          textAlign: 'center',
        }}
      >
        나의 우승 여행지
      </div>

      {/* title — sp 30 위. Inter ExtraBold 90 line 108 ls -0.04em white. */}
      <div
        style={{
          display: 'flex',
          fontSize: 90,
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.04em',
          lineHeight: 1.2,
          marginTop: 30,
          textAlign: 'center',
        }}
      >
        {winner}
      </div>

      {/* meta — sp 24 위. Inter Medium 40.5 line 48 white opacity 0.92.
          Figma 명시 letterSpacing X — 제거 (2026-06-24 정합). */}
      {metaText && (
        <div
          style={{
            display: 'flex',
            fontSize: 40.5,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.92)',
            lineHeight: 1.185,
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          {metaText}
        </div>
      )}

      {/* description — sp 54 위. Inter Regular 40.5 line 160% white 0.9 max-width 888.
          Figma 명시 letterSpacing X — 제거 (2026-06-24 정합).
          desc 가 비면 row 자체 미노출. */}
      {desc && (
        <div
          style={{
            display: 'flex',
            fontSize: 40.5,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 1.6,
            marginTop: 54,
            maxWidth: 888,
            textAlign: 'center',
            // line clamp — Satori 가 -webkit 미지원이지만 description 은 너무
            // 길면 자체 wrap 됨. 명시 길이 강제 자르기 위해 substring.
          }}
        >
          {desc.length > 80 ? `${desc.slice(0, 80)}…` : desc}
        </div>
      )}

      {/* grow space — match-badge 를 아래쪽으로 밀어내기 */}
      <div style={{ display: 'flex', flex: 1 }} />

      {/* match-badge — 471×96 white opacity 0.16 padding 24 54 + Inter Bold 40.5 white.
          Figma 명시 letterSpacing X — 제거 (2026-06-24 정합). */}
      {matches && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 24,
            paddingBottom: 24,
            paddingLeft: 54,
            paddingRight: 54,
            background: 'rgba(255, 255, 255, 0.16)',
            borderRadius: 999,
            fontSize: 40.5,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.185,
          }}
        >
          총 {matches}매치 끝의 우승 🏆
        </div>
      )}

      {/* footer — sp 60 (20×3) 위. row gap 18 (6×3) center, opacity 0.95
          (Figma 명시 — 2026-06-24 정합). BrandLogo 54 + "여행 한입" Inter
          ExtraBold 39 ls -0.02em white. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          marginTop: 60,
          opacity: 0.95,
        }}
      >
        {/* OG 카드 bg = primary #00B334. BrandLogo 큰 path 기본 #00B334 라
            동색 → 안 보임. mainFill="#FFFFFF" 로 override (Figma spec — 큰
            leaf white + amber accent 2). */}
        <BrandLogo
          width={54}
          ariaHidden
          mainFill="#FFFFFF"
          style={{ display: 'block' }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 39,
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.23, // Figma 16/13 정합 (2026-06-24)
          }}
        >
          여행 한입
        </div>
      </div>
    </div>,
    makeInit(fontData, { width: 1080, height: 1500 }),
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
        background:
          'linear-gradient(180deg, #FFF4E6 0%, #FFFFFF 54%, #FCEAD3 100%)',
        // Figma border 1px #C6C6C6 + radius 20 — OG image 는 1080×1080 PNG
        // 사각형 자체. radius/border 가 시각적으로 보이게 안쪽 inset (사각형
        // 모서리 둥글게는 PNG 출력 불가능하지만 카드 외곽선 표현은 가능).
        border: '3px solid #C6C6C6',
        borderRadius: 60,
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

      {/* keyword pills row — secondary01 bg primary color Caption B_10 */}
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
                background: '#EAF6EF',
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

      {/* description R_14 muted center */}
      {tagline && (
        <div
          style={{
            display: 'flex',
            fontSize: 42,
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
          <div style={{ display: 'flex', fontSize: 42, lineHeight: 1 }}>
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
        <BrandLogo width={54} ariaHidden style={{ display: 'block' }} />
        <div
          style={{
            display: 'flex',
            fontSize: 39,
            fontWeight: 700,
            color: '#00B334',
            letterSpacing: '-0.02em',
            lineHeight: 1.23,
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
        background: 'linear-gradient(180deg, #8DEF80 0%, #C5F5D9 100%)',
        border: '3px solid #C6C6C6',
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

      {/* subtitle "CHUNGBUK MASTER" Bold 13 ls 0.16em opacity 0.9.
          Frame 21 gap 4 (×3=12). */}
      <div
        style={{
          display: 'flex',
          fontSize: 39,
          fontWeight: 700,
          color: '#151515',
          opacity: 0.9,
          letterSpacing: '0.16em',
          lineHeight: 1.23,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        CHUNGBUK MASTER
      </div>

      {/* title "충북 마스터" ExtraBold 30 ls -0.03em. Frame 23 gap 24
          (×3=72) — title ↔ msg-box. */}
      <div
        style={{
          display: 'flex',
          fontSize: 90,
          fontWeight: 800,
          color: '#151515',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: 72,
          textAlign: 'center',
        }}
      >
        충북 마스터
      </div>

      {/* msg-box white radius 12 padding 20 18 + Medium 14 170% muted center.
          Frame 24 gap 20 (×3=60) — msg-box ↔ brand. */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          paddingTop: 60,
          paddingBottom: 60,
          paddingLeft: 54,
          paddingRight: 54,
          background: '#FFFFFF',
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
        <BrandLogo width={66} ariaHidden style={{ display: 'block' }} />
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
