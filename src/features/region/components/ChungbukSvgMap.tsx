'use client';

import type { RegionCode } from '@/constants/regions';
import { CHUNGBUK_REGIONS } from '@/constants/regions';
import styles from './ChungbukSvgMap.module.scss';

/**
 * <ChungbukSvgMap />
 *
 * 충북 11개 시군을 단순 격자(grid) SVG 로 표현 — 정밀 path 데이터는 별 PR
 * (TopoJSON → SVG path 변환). 현재는 도장깨기 시각화 + 클릭 이동만 충족.
 *
 * 시각화:
 *   - 5 cols × 3 rows 격자 — 충북 시군의 대략 지리 배치
 *   - visited 시군: primary 채움 + ✓ 도장
 *   - non-visited: muted border + 시군명
 *   - 클릭 시 onRegionClick(code)
 *
 * 접근성:
 *   - <button role="img" aria-label="..."> 로 감싸 키보드 / SR 지원
 *   - svg 는 aria-hidden, 라벨은 visually-hidden 텍스트 + 표시 텍스트 둘 다
 */

type CellPos = { col: number; row: number };

/**
 * 충북 시군 대략 격자 좌표 (5 cols × 3 rows).
 * 실측 좌표 아님 — UX 가독성 우선.
 *
 *  | col\row |   0       |   1        |   2       |
 *  |---------|-----------|------------|-----------|
 *  |   0     | 단양      |            |           |
 *  |   1     | 제천      | 충주       |           |
 *  |   2     | 음성      | 진천       | 괴산      |
 *  |   3     | 증평      | 청주       | 보은      |
 *  |   4     |           | 옥천       | 영동      |
 */
const POS: Record<RegionCode, CellPos> = {
  danyang: { col: 0, row: 0 },
  jecheon: { col: 1, row: 0 },
  chungju: { col: 1, row: 1 },
  eumseong: { col: 2, row: 0 },
  jincheon: { col: 2, row: 1 },
  goesan: { col: 2, row: 2 },
  jeungpyeong: { col: 3, row: 0 },
  cheongju: { col: 3, row: 1 },
  boeun: { col: 3, row: 2 },
  okcheon: { col: 4, row: 1 },
  yeongdong: { col: 4, row: 2 },
};

const CELL = 56;
const GAP = 8;
const COLS = 5;
const ROWS = 3;
const PADDING = 12;

const WIDTH = COLS * CELL + (COLS - 1) * GAP + PADDING * 2;
const HEIGHT = ROWS * CELL + (ROWS - 1) * GAP + PADDING * 2;

export function ChungbukSvgMap({
  visited,
  onRegionClick,
}: {
  visited: ReadonlySet<RegionCode>;
  onRegionClick?: (code: RegionCode) => void;
}) {
  return (
    <div
      className={styles.wrap}
      role="group"
      aria-label="충북 11개 시군 도장깨기 지도"
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={styles.svg}
        aria-hidden
      >
        {CHUNGBUK_REGIONS.map((r) => {
          const pos = POS[r.code];
          const x = PADDING + pos.col * (CELL + GAP);
          const y = PADDING + pos.row * (CELL + GAP);
          const isVisited = visited.has(r.code);
          return (
            <g
              key={r.code}
              transform={`translate(${x}, ${y})`}
              className={`${styles.cell} ${isVisited ? styles.visited : ''}`}
              onClick={onRegionClick ? () => onRegionClick(r.code) : undefined}
            >
              <rect
                width={CELL}
                height={CELL}
                rx={10}
                ry={10}
                className={styles.tile}
              />
              <text
                x={CELL / 2}
                y={CELL / 2 + 4}
                textAnchor="middle"
                className={styles.label}
              >
                {r.ko.replace(/(시|군)$/, '')}
              </text>
              {isVisited && (
                <text
                  x={CELL - 10}
                  y={14}
                  textAnchor="end"
                  className={styles.stamp}
                  aria-hidden
                >
                  ✓
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className={styles.srList}>
        {CHUNGBUK_REGIONS.map((r) => (
          <li key={r.code}>
            {r.ko} {visited.has(r.code) ? '방문' : '미방문'}
          </li>
        ))}
      </ul>
    </div>
  );
}
