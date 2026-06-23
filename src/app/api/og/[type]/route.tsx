import { ImageResponse } from 'next/og';
import { destinationSeeds } from '@/mocks/seeds/destinations';
import { regionContentSeeds } from '@/mocks/seeds/regions';
import { CHUNGBUK_REGIONS } from '@/constants/regions';

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

function makeInit(fontData: ArrayBuffer | null): ImageInit {
  const init: ImageInit = {
    width: SIZE,
    height: SIZE,
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

function renderTournament(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const winner = q.get('winner') ?? '여행지';
  const regionCode = q.get('region') ?? '';
  const region = REGION_KO[regionCode] ?? regionCode;
  const category = q.get('category') ?? '';
  const categoryLabel = CATEGORY_KO[category] ?? '';
  const emoji = CATEGORY_EMOJI[category] ?? '🏆';
  const matches = q.get('matches');
  const footerText = matches
    ? `총 ${matches}매치 끝의 우승`
    : '나의 여행지 우승';
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
        background: 'linear-gradient(180deg, #fff7ed 0%, #fdf2f8 100%)',
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
        <span>🏆 토너먼트 우승</span>
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
          {winner}
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
        {footerText}
      </div>
    </div>,
    makeInit(fontData),
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

      {/* footer — absolute bottom 60 (Figma 20×3) center, 여행 한입 Inter
          ExtraBold 13 primary */}
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
        <div style={{ display: 'flex', fontSize: 48, lineHeight: 1 }}>🥢</div>
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
 * 충북 마스터 달성 카드 — 11/11 도장 완료 시 공유 카드.
 *
 * 디자인: Sage 톤 그라데이션 배경 + 큰 트로피/체크 emoji + "충북 마스터" 큰 텍스트 +
 *         "충북 11개 시군 모두 정복" 부제 + TripBite 푸터.
 *
 * Query:
 *   - count (optional) — 보통 11. 다른 값 (예: 향후 확장) 대비.
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
        background: 'linear-gradient(180deg, #d4e2d4 0%, #6b8e6b 100%)',
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
          color: '#ffffff',
        }}
      >
        <span>🏞️ 충북 도장책</span>
        <span style={{ opacity: 0.85 }}>TripBite</span>
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
            marginBottom: 16,
          }}
        >
          🏆
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          충북 마스터
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: '#ffffff',
            marginTop: 24,
            opacity: 0.92,
          }}
        >
          {count}개 시군 모두 정복
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: 28,
          color: '#ffffff',
          opacity: 0.85,
        }}
      >
        충북 11개 시군 도장 완료
      </div>
    </div>,
    makeInit(fontData),
  );
}
