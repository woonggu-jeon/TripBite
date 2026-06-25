'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { haptic } from '@/lib/haptic';
import styles from './LuckyLadder.module.scss';

// path draw 애니메이션 1.4s + 약간의 여유. reduced-motion 시 즉시 공개.
const REVEAL_MS = 1500;
// 결과 % count-up 시간
const COUNTUP_MS = 800;

/**
 * 사다리타기 — N개 라인 중 하나를 선택하면 사다리를 따라 내려가
 * 끝점에 적힌 랜덤 %를 결과로 보여줌.
 *
 * 흐름:
 *   idle      : 라인 선택 안내 ↓
 *   rolling   : 사다리 path 그려지는 중 (1.4s)
 *   revealed  : 도착점 % 강조 + 다시 시도
 *
 * 모드:
 *   - independent: 각 끝점이 독립 랜덤 0~100%
 *   - sum100:      6개 합 100% 분배
 *
 * 다시(reset) 시 사다리·% 모두 재생성. 라이브러리 없이 SVG + CSS만.
 */

export type LuckyLadderMode = 'independent' | 'sum100';

interface Rung {
  row: number; // 0..rows-1
  col: number; // 왼쪽 세로선 인덱스 (col ~ col+1을 잇는 가로선)
}

function generateRungs(cols: number, rows: number): Rung[] {
  const rungs: Rung[] = [];
  for (let r = 0; r < rows; r++) {
    const used = new Set<number>();
    for (let c = 0; c < cols - 1; c++) {
      if (used.has(c - 1)) continue; // 인접 가로선 회피
      if (Math.random() < 0.45) {
        rungs.push({ row: r, col: c });
        used.add(c);
      }
    }
  }
  return rungs;
}

const MIN_PERCENT = 7;

function generatePercents(count: number, mode: LuckyLadderMode): number[] {
  if (mode === 'independent') {
    // 최소 7% 보장 — 너무 낮은 결과 방지
    return Array.from(
      { length: count },
      () => MIN_PERCENT + Math.floor(Math.random() * (101 - MIN_PERCENT)),
    );
  }
  // sum100: 최소 7 보장 후 나머지 (100 - 7*count) 를 random 분배
  const remainder = 100 - MIN_PERCENT * count;
  if (remainder < 0) {
    // count 가 너무 많아 최소 보장 불가 — 균등 분배 fallback
    return Array.from({ length: count }, () => Math.floor(100 / count));
  }
  const raws = Array.from({ length: count }, () => Math.random());
  const sum = raws.reduce((a, b) => a + b, 0);
  const portions = raws.map((r) => Math.round((r / sum) * remainder));
  // 반올림 보정
  const diff = remainder - portions.reduce((a, b) => a + b, 0);
  portions[0] = (portions[0] ?? 0) + diff;
  return portions.map((p) => MIN_PERCENT + p);
}

function tracePath(
  startCol: number,
  rungs: Rung[],
  rows: number,
): { row: number; col: number }[] {
  const path: { row: number; col: number }[] = [{ row: 0, col: startCol }];
  let col = startCol;
  for (let r = 0; r < rows; r++) {
    const rightRung = rungs.find((g) => g.row === r && g.col === col);
    const leftRung = rungs.find((g) => g.row === r && g.col === col - 1);
    if (rightRung) {
      path.push({ row: r + 0.5, col });
      col += 1;
      path.push({ row: r + 0.5, col });
    } else if (leftRung) {
      path.push({ row: r + 0.5, col });
      col -= 1;
      path.push({ row: r + 0.5, col });
    }
    path.push({ row: r + 1, col });
  }
  return path;
}

export interface LuckyLadderProps {
  /** 슬롯 개수 (기본 6) */
  count?: number;
  /** 사다리 행 수 (기본 8) */
  rows?: number;
  /** 초기 모드 (기본 independent) */
  initialMode?: LuckyLadderMode;
}

export function LuckyLadder({
  count = 6,
  rows = 8,
  initialMode = 'independent',
}: LuckyLadderProps) {
  const t = useTranslations('tournament.result.ladder');
  const mode = initialMode;
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  // 결과 % count-up 표시값 (0 → 최종)
  const [displayPercent, setDisplayPercent] = useState(0);
  // path 의 React key 변수로만 사용 — 재생성 트리거 (handleRetry) 제거됨
  // (2026-06-24 사용자 명시). 초기값 0 고정 — setter 불필요.
  const [resetKey] = useState(0);

  const { rungs, percents } = useMemo(
    () => ({
      rungs: generateRungs(count, rows),
      percents: generatePercents(count, mode),
    }),
    // resetKey 는 다시 시도 시 사다리·% 재생성용 — exhaustive-deps 의도적 회피
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, rows, mode, resetKey],
  );

  const handlePick = useCallback(
    (col: number) => {
      if (selected !== null) return; // 이미 선택됨 — 다시 시도 버튼으로만 재선택
      haptic.tap();
      setSelected(col);
      setRevealed(false);
    },
    [selected],
  );

  // handleRetry 제거 (사용자 명시 2026-06-24) — ladder card 안 "다시 시도"
  // button 폐기. resetKey 는 path 의 React key 변경에만 의존하므로 setResetKey
  // 호출이 없어도 초기값 0 으로 고정 OK.

  // 선택 후 경로 애니메이션이 끝나면 % 공개
  useEffect(() => {
    if (selected === null) {
      setRevealed(false);
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(
      () => {
        setRevealed(true);
        haptic.success();
      },
      reduced ? 50 : REVEAL_MS,
    );
    return () => window.clearTimeout(id);
  }, [selected, mode]);

  // Figma ladder svg 280×337 정합. H 337 → 380, bottomPad 56 — endpoint rect
  // 위 endPop scale 1.15 animation 시 transform-box fill-box 가 일부 브라우저
  // 에서 view-box fallback → endpoint 위쪽이 svg viewport 밖으로 잘림 (사용자
  // 명시 2026-06-25 반복 보고). H 증가 + 추가 padding 으로 안전 여유 확보.
  const W = 280;
  const H = 380;
  const topPad = 32;
  const bottomPad = 56;
  const sidePad = 24;
  const colX = (i: number) => sidePad + (i * (W - sidePad * 2)) / (count - 1);
  const rowY = (r: number) => topPad + (r * (H - topPad - bottomPad)) / rows;

  const path = selected !== null ? tracePath(selected, rungs, rows) : [];
  // 사다리 끝 col (= 도착 라인). 결과 % 인덱싱은 시작 col 이 아니라 endCol 기준.
  const endCol =
    selected !== null && path.length > 0
      ? (path[path.length - 1]?.col ?? selected)
      : null;
  const resultPercent =
    revealed && endCol !== null ? (percents[endCol] ?? null) : null;

  // 결과 공개 시 0 → resultPercent count-up (easeOutCubic).
  // reduced-motion 시 즉시 표시.
  useEffect(() => {
    if (!revealed || resultPercent === null) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplayPercent(resultPercent);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(1, elapsed / COUNTUP_MS);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayPercent(Math.round(eased * resultPercent));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, resultPercent]);

  return (
    <section className={styles.card} aria-label={t('svgLabel')}>
      {/* Frame 49 column gap 4 — title B_16 fg + caption R_12 muted */}
      <header className={styles.head}>
        <h3 className={styles.cardTitle}>{t('title')}</h3>
        <p className={styles.caption}>{t('subtitle')}</p>
      </header>

      {/* Frame 50 column — ladder svg 280×337 (사용자 명시 2026-06-24:
          "결과 보기" eyebrow 제거 — title 자체가 "여행에서 인연을 만날 확률"
          로 명시적). */}
      <div className={styles.viewer}>
        <p
          className={styles.hint}
          aria-live="polite"
          data-state={
            selected === null ? 'idle' : revealed ? 'revealed' : 'rolling'
          }
        >
          {selected === null && (
            <>
              <span aria-hidden className={styles.hintArrow}>
                ↓
              </span>
              {t('hintIdle')}
            </>
          )}
          {selected !== null && !revealed && t('hintRolling')}
          {revealed && t('hintRevealed')}
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          role="img"
          aria-label={t('svgLabel')}
        >
          {/* 세로선 */}
          {Array.from({ length: count }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={colX(i)}
              y1={rowY(0)}
              x2={colX(i)}
              y2={rowY(rows)}
              stroke="var(--color-border)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* 가로선 */}
          {rungs.map((g, i) => (
            <line
              key={`r${i}`}
              x1={colX(g.col)}
              y1={rowY(g.row + 0.5)}
              x2={colX(g.col + 1)}
              y2={rowY(g.row + 0.5)}
              stroke="var(--color-border)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* 시작점 — 클릭 가능 (선택 전에만) */}
          {Array.from({ length: count }).map((_, i) => {
            const isPicked = selected === i;
            const isLocked = selected !== null && !isPicked;
            return (
              <g
                key={`s${i}`}
                onClick={() => handlePick(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePick(i);
                  }
                }}
                role="button"
                tabIndex={selected === null ? 0 : -1}
                aria-label={t('lineLabel', { n: i + 1 })}
                aria-pressed={isPicked}
                className={
                  isPicked
                    ? `${styles.startPoint} ${styles.startPointPicked}`
                    : isLocked
                      ? `${styles.startPoint} ${styles.startPointLocked}`
                      : styles.startPoint
                }
              >
                <circle
                  cx={colX(i)}
                  cy={rowY(0) - 18}
                  r={14}
                  fill={isPicked ? 'var(--color-primary)' : 'var(--color-bg)'}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                />
                <text
                  x={colX(i)}
                  y={rowY(0) - 14}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={
                    isPicked
                      ? 'var(--color-primary-fg)'
                      : 'var(--color-primary)'
                  }
                >
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* 끝점 — 도착 라인의 % 만 revealed 시 공개. 나머지는 항상 '?'.
              rect height 26 → 36 + text alphabetic baseline 명시 계산 (cross-
              browser 호환 — dominantBaseline 미사용). rect 안 위아래 여유 확보로
              사용자 보고 "위쪽 잘림" 회귀 해결 (2026-06-25). */}
          {percents.map((p, i) => {
            const isEnd = endCol === i;
            const showPercent = revealed && isEnd;
            const dimmed = selected !== null && !isEnd;
            const rectY = rowY(rows) + 8;
            const rectH = 36;
            return (
              <g
                key={`e${i}`}
                className={showPercent ? styles.endRevealed : undefined}
              >
                <rect
                  x={colX(i) - 22}
                  y={rectY}
                  width={44}
                  height={rectH}
                  rx={18}
                  fill={
                    showPercent ? 'var(--color-primary)' : 'var(--color-muted)'
                  }
                  opacity={dimmed ? 0.4 : 1}
                />
                {/* alphabetic baseline = rect center + fontSize * 0.36
                    (descent 보정). dominantBaseline 의 브라우저별 fontmetric
                    fallback 회피. */}
                <text
                  x={colX(i)}
                  y={rectY + rectH / 2 + 12 * 0.36}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="var(--color-primary-fg)"
                  opacity={dimmed ? 0.6 : 1}
                >
                  {showPercent ? `${p}%` : '?'}
                </text>
              </g>
            );
          })}

          {/* 선택 경로 — stroke-dashoffset 애니메이션 */}
          {selected !== null && (
            <polyline
              key={`path-${selected}-${mode}-${resetKey}`}
              points={path
                .map((p) => `${colX(p.col)},${rowY(p.row)}`)
                .join(' ')}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.path}
            />
          )}
        </svg>
      </div>

      {/* 결과 강조 패널 — revealed 시 ladder card 하단에 명확히 배치. retry
          button 제거 (사용자 명시 2026-06-24). value 가 먼저 (큰 숫자), 그
          아래에 라벨 — 결과 % 가 강조되도록 시각 위계. */}
      {revealed && resultPercent !== null && (
        <div className={styles.result} role="status" aria-live="polite">
          <span className={styles.resultValue}>
            <span className={styles.resultNumber}>{displayPercent}</span>
            <span className={styles.resultUnit}>%</span>
          </span>
          <span className={styles.resultLabel}>{t('resultLabel')}</span>
        </div>
      )}
    </section>
  );
}
