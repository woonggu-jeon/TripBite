import Image from 'next/image';

/**
 * Figma 일러스트 에셋 — `seasonIcon` / `tripTypeIcon` / `themeIcon` 세트.
 *
 * 시안의 이 아이콘들은 벡터가 아니라 **래스터 이미지**다 (각 변형이 IMAGE fill
 * 사각형 1개). 세트별로 한 장의 아틀라스에 모여 있고 변형마다 imageTransform
 * 으로 잘라 쓴다 — 그 crop 좌표대로 원본(2048/4096) 에서 잘라 192px PNG 로
 * 뽑아 `public/illustrations` 에 커밋했다 (각 8~12KB).
 *
 * 192px 인 이유: 최대 표시 크기가 64 라 3x 까지 커버한다.
 */
export type IllustrationName =
  | 'season-spring'
  | 'season-summer'
  | 'season-autumn'
  | 'season-winter'
  | 'triptype-challenge'
  | 'triptype-explore'
  | 'triptype-rest'
  | 'triptype-taste'
  | 'theme-season'
  | 'theme-dice'
  // Figma `cateIcon` 36 변형 (festival / tour / experience) — 토너먼트
  // 카테고리 선택. 이쪽은 아틀라스가 아니라 노드 단위 export(108px) 다.
  | 'cate-festival'
  | 'cate-tour'
  | 'cate-experience';

export function Illustration({
  name,
  size = 36,
  className,
}: {
  name: IllustrationName;
  /** 시안 사용 크기 — season 36/64, tripType 36/52, theme 36. */
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={`/illustrations/${name}.png`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      // 장식용이라 우선순위 낮음. 크기가 작아 srcset 변환 이득이 없어 원본 사용.
      unoptimized
    />
  );
}
