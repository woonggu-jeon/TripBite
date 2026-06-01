import { ImageResponse } from 'next/og';

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
 * 디자인 노트:
 *   - Satori 는 CSS 의 부분 집합만 지원 (flex 안전 / grid 일부 / shadow 일부).
 *   - 외부 이미지 fetch X (콜드스타트 단축). 이모지 + 그라데이션 + 텍스트만.
 *   - 한글 폰트 — Pretendard Bold woff 를 jsdelivr 에서 fetch (Edge instance 재사용 캐시).
 *   - 이모지 — Satori 가 Twemoji SVG 자동 fetch.
 *
 * 카드 디자인은 미니멀 기본형. 추후 디자이너 시안 받으면 JSX 만 교체.
 */
export const runtime = 'edge';

// 같은 Edge instance 가 살아있는 동안 폰트 재사용.
let cachedFont: ArrayBuffer | null = null;
async function getPretendard(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch(
    'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/woff/Pretendard-Bold.woff',
  );
  cachedFont = await res.arrayBuffer();
  return cachedFont;
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

type Params = { params: Promise<{ type: string }> };

export async function GET(
  request: Request,
  { params }: Params,
): Promise<Response> {
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const fontData = await getPretendard();

  if (type === 'tournament') {
    return renderTournament(searchParams, fontData);
  }
  if (type === 'quiz') {
    return renderQuiz(searchParams, fontData);
  }
  return new Response('Not found', { status: 404 });
}

function renderTournament(
  q: URLSearchParams,
  fontData: ArrayBuffer,
): ImageResponse {
  const winner = q.get('winner') ?? '여행지';
  const regionCode = q.get('region') ?? '';
  const region = REGION_KO[regionCode] ?? regionCode;
  const category = q.get('category') ?? '';
  const categoryLabel = CATEGORY_KO[category] ?? '';
  const emoji = CATEGORY_EMOJI[category] ?? '🏆';
  const matches = q.get('matches');

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #fff7ed 0%, #fdf2f8 100%)',
        padding: 80,
        fontFamily: 'Pretendard',
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
          gap: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 220, lineHeight: 1 }}>{emoji}</div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            padding: '0 40px',
            display: 'flex',
            textAlign: 'center',
          }}
        >
          {winner}
        </div>
        {(region || categoryLabel) && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              fontSize: 36,
              color: '#52525b',
              marginTop: 8,
            }}
          >
            {region && <span>{region}</span>}
            {region && categoryLabel && (
              <span style={{ color: '#a1a1aa' }}>·</span>
            )}
            {categoryLabel && <span>{categoryLabel}</span>}
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
        {matches ? `총 ${matches}매치 끝의 우승` : '나의 여행지 우승'}
      </div>
    </div>,
    {
      width: SIZE,
      height: SIZE,
      fonts: [
        {
          name: 'Pretendard',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    },
  );
}

function renderQuiz(q: URLSearchParams, fontData: ArrayBuffer): ImageResponse {
  const typeCode = q.get('type') ?? '';
  const typeName = q.get('name') ?? '여행 유형';
  const tagline = q.get('tagline') ?? '';
  const emoji = TYPE_EMOJI[typeCode] ?? '✨';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #eff6ff 0%, #f0f9ff 100%)',
        padding: 80,
        fontFamily: 'Pretendard',
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
          gap: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 220, lineHeight: 1 }}>{emoji}</div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 700,
            color: '#18181b',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            padding: '0 40px',
            display: 'flex',
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
              marginTop: 8,
              padding: '0 60px',
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
    {
      width: SIZE,
      height: SIZE,
      fonts: [
        {
          name: 'Pretendard',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    },
  );
}
