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

  const validTypes = ['tournament', 'quiz', 'destination', 'region'] as const;
  type OgType = (typeof validTypes)[number];
  if (!(validTypes as readonly string[]).includes(type)) {
    return new Response('Not found', { status: 404 });
  }

  const fontData = await getPretendard();

  try {
    switch (type as OgType) {
      case 'tournament':
        return renderTournament(searchParams, fontData);
      case 'quiz':
        return renderQuiz(searchParams, fontData);
      case 'destination':
        return renderDestination(searchParams, fontData);
      case 'region':
        return renderRegion(searchParams, fontData);
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

function renderQuiz(
  q: URLSearchParams,
  fontData: ArrayBuffer | null,
): ImageResponse {
  const typeCode = q.get('type') ?? '';
  const typeName = q.get('name') ?? '여행 유형';
  const tagline = q.get('tagline') ?? '';
  const emoji = TYPE_EMOJI[typeCode] ?? '✨';
  const fontFamily = fontData ? 'Pretendard' : 'sans-serif';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f0f9ff 100%)',
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
        <span>✨ 나의 여행 유형</span>
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
            fontSize: 88,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          {typeName}
        </div>
        {tagline && (
          <div
            style={{
              display: 'flex',
              fontSize: 36,
              color: '#52525b',
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            {tagline}
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
        나의 여행 유형 테스트 결과
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
