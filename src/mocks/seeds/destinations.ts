import type {
  DestinationCategory,
  DestinationDto,
} from '@/api/generated/schemas';
import type { RegionCode } from '@/constants/regions';

/**
 * 충북 11개 시군 × 카테고리 4종 × 2개씩 = 88개 mock 여행지
 *
 * 실제 충북 대표 명소를 기반으로 하되, 데이터 정확성보다 UX 검증에 무게.
 * 백엔드 연동 시 자연스럽게 교체.
 */
type SeedRow = {
  region: RegionCode;
  local: [string, string];
  festival: [string, string];
  attraction: [string, string];
  experience: [string, string];
};

const DATA: SeedRow[] = [
  {
    region: 'cheongju',
    local: ['청주 가로수길', '수암골 벽화마을'],
    festival: ['청주공예비엔날레', '청주문화재야행'],
    attraction: ['청남대', '상당산성'],
    experience: ['청주국립박물관', '청주랜드'],
  },
  {
    region: 'chungju',
    local: ['중앙탑 야경거리', '충주 사과거리'],
    festival: ['충주세계무술축제', '충주사과축제'],
    attraction: ['탄금대', '충주호'],
    experience: ['충주활옷체험관', '중앙탑사적공원'],
  },
  {
    region: 'jecheon',
    local: ['청풍호 자드락길', '박달재 옛길'],
    festival: ['제천국제음악영화제', '제천한방바이오박람회'],
    attraction: ['의림지', '청풍호반'],
    experience: ['한방엑스포공원', '청풍문화재단지'],
  },
  {
    region: 'boeun',
    local: ['정이품송 거리', '말티재 마을'],
    festival: ['보은대추축제', '속리축전'],
    attraction: ['속리산국립공원', '법주사'],
    experience: ['보은 솔향공원', '말티재 전망대'],
  },
  {
    region: 'okcheon',
    local: ['옥천 구읍거리', '둔주봉 한반도지형'],
    festival: ['옥천묘목축제', '지용제'],
    attraction: ['정지용 문학관', '향수호수길'],
    experience: ['옥천전통문화체험관', '장령산자연휴양림'],
  },
  {
    region: 'yeongdong',
    local: ['영동 와인거리', '강선대 송림'],
    festival: ['난계국악축제', '영동포도축제'],
    attraction: ['영동와인터널', '월류봉'],
    experience: ['난계국악박물관', '노근리평화공원'],
  },
  {
    region: 'jincheon',
    local: ['생거진천 옛마을', '농다리 미르숲'],
    festival: ['진천화랑축제', '생거진천쌀축제'],
    attraction: ['진천농다리', '보탑사'],
    experience: ['종박물관', '김유신탄생지'],
  },
  {
    region: 'goesan',
    local: ['화양구곡 마을', '문광저수지 은행나무길'],
    festival: ['괴산고추축제', '괴산김장축제'],
    attraction: ['산막이옛길', '칠보산'],
    experience: ['괴산문광저수지', '쌍곡계곡'],
  },
  {
    region: 'eumseong',
    local: ['무극시장 골목', '음성 한우거리'],
    festival: ['음성품바축제', '음성설성문화제'],
    attraction: ['큰바위얼굴조각공원', '봉학골산림욕장'],
    experience: ['수레의산자연휴양림', '음성생극농촌체험마을'],
  },
  {
    region: 'danyang',
    local: ['단양 구경시장', '온달관광지 마을'],
    festival: ['단양마늘축제', '단양강 어죽축제'],
    attraction: ['도담삼봉', '단양강 잔도'],
    experience: ['만천하스카이워크', '단양구경시장'],
  },
  {
    region: 'jeungpyeong',
    local: ['보강천 미루나무숲', '증평 인삼거리'],
    festival: ['증평인삼축제', '좌구산 생태문화축제'],
    attraction: ['좌구산자연휴양림', '삼기저수지'],
    experience: ['증평민속체험박물관', '백두대간생태교육장'],
  },
];

const CATEGORIES: DestinationCategory[] = [
  'festival',
  'attraction',
  'experience',
];

/**
 * BE 실 데이터 id 체계 = `tour-<contentid>` (TourAPI contentid).
 * mock seed 도 같은 형식으로 정합 — region/category/index 입력 → deterministic 7자리 정수.
 * cross-reference (SAVED_PICKS 등) 에서 같은 region/category/idx 면 같은 id 산출.
 */
export function tourSeedId(
  region: RegionCode,
  category: DestinationCategory,
  idx: number,
): string {
  const s = `${region}-${category}-${idx}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `tour-${(Math.abs(h) % 9000000) + 1000000}`;
}

export const destinationSeeds: DestinationDto[] = DATA.flatMap((row) =>
  CATEGORIES.flatMap((c) =>
    row[c].map((name, i) => ({
      id: tourSeedId(row.region, c, i + 1),
      name,
      category: c,
      region: row.region,
      imageUrl: undefined,
    })),
  ),
);
