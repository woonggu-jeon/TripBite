'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { haptic } from '@/lib/haptic';
import styles from './LuckyLadder.module.scss';

// path draw 애니메이션 1.4s + 약간의 여유. reduced-motion 시 즉시 공개.
const REVEAL_MS = 1500;

/**
 * 사다리타기 — N개 라인 중 하나를 선택하면 사다리를 따라 내려가
 * 끝점에 적힌 랜덤 %를 결과로 보여줌. 항목 입력 없이 시작점 원 클릭만으로 시작.
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

function generatePercents(count: number, mode: LuckyLadderMode): number[] {
  if (mode === 'independent') {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 101));
  }
  const raws = Array.from({ length: count }, () => Math.random());
  const sum = raws.reduce((a, b) => a + b, 0);
  const percents = raws.map((r) => Math.round((r / sum) * 100));
  // 반올림 보정 — 합 100 맞춤
  const diff = 100 - percents.reduce((a, b) => a + b, 0);
  percents[0] = (percents[0] ?? 0) + diff;
  return percents;
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
  const [mode, setMode] = useState<LuckyLadderMode>(initialMode);
  const [selected, setSelected] = useState<number | null>(null);
  const [seed, setSeed] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const { rungs, percents } = useMemo(() => {
    void seed; // seed 변경 시 재생성
    return {
      rungs: generateRungs(count, rows),
      percents: generatePercents(count, mode),
    };
  }, [count, rows, mode, seed]);

  const handlePick = useCallback((col: number) => {
    haptic.tap();
    setSelected(col);
    setRevealed(false);
  }, []);

  const reset = useCallback(() => {
    setSelected(null);
    setRevealed(false);
    setSeed((s) => s + 1);
  }, []);

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
      () => setRevealed(true),
      reduced ? 50 : REVEAL_MS,
    );
    return () => window.clearTimeout(id);
  }, [selected, seed, mode]);

  const W = 320;
  const H = 380;
  const topPad = 36;
  const bottomPad = 44;
  const sidePad = 30;
  const colX = (i: number) => sidePad + (i * (W - sidePad * 2)) / (count - 1);
  const rowY = (r: number) => topPad + (r * (H - topPad - bottomPad)) / rows;

  const path = selected !== null ? tracePath(selected, rungs, rows) : [];
  // 사다리 끝 col (= 도착 라인). 결과 % 인덱싱은 시작 col 이 아니라 endCol 기준.
  const endCol =
    selected !== null && path.length > 0
      ? (path[path.length - 1]?.col ?? selected)
      : null;
  const resultPercent =
    revealed && endCol !== null ? (percents[endCol] ?? 0) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.toggle} role="group" aria-label="모드 선택">
        <button
          type="button"
          className={mode === 'independent' ? styles.active : ''}
          aria-pressed={mode === 'independent'}
          onClick={() => {
            setMode('independent');
            setSelected(null);
          }}
        >
          독립 랜덤
        </button>
        <button
          type="button"
          className={mode === 'sum100' ? styles.active : ''}
          aria-pressed={mode === 'sum100'}
          onClick={() => {
            setMode('sum100');
            setSelected(null);
          }}
        >
          100% 분배
        </button>
        <button
          type="button"
          className={styles.reset}
          onClick={reset}
          aria-label="새 사다리"
        >
          🔄 새로
        </button>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label="사다리타기"
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

        {/* 시작점 — 클릭 가능 */}
        {Array.from({ length: count }).map((_, i) => (
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
            tabIndex={0}
            aria-label={`${i + 1}번 라인 선택`}
            className={styles.startPoint}
          >
            <circle
              cx={colX(i)}
              cy={rowY(0) - 18}
              r={14}
              fill={selected === i ? 'var(--color-primary)' : 'var(--color-bg)'}
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
                selected === i
                  ? 'var(--color-primary-fg)'
                  : 'var(--color-primary)'
              }
            >
              {i + 1}
            </text>
          </g>
        ))}

        {/* 끝점 % — 도착 라인 강조는 endCol 기준. 공개 전엔 '?' 로 가림. */}
        {percents.map((p, i) => {
          const isEnd = endCol === i;
          const dimmed = selected !== null && !isEnd;
          return (
            <g key={`e${i}`}>
              <rect
                x={colX(i) - 22}
                y={rowY(rows) + 8}
                width={44}
                height={26}
                rx={13}
                fill={
                  revealed && isEnd
                    ? 'var(--color-primary)'
                    : 'var(--color-muted)'
                }
                opacity={dimmed && !revealed ? 0.5 : 1}
              />
              <text
                x={colX(i)}
                y={rowY(rows) + 25}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="var(--color-primary-fg)"
              >
                {revealed ? `${p}%` : '?'}
              </text>
            </g>
          );
        })}

        {/* 선택 경로 — stroke-dashoffset 애니메이션 */}
        {selected !== null && (
          <polyline
            key={`path-${selected}-${seed}-${mode}`}
            points={path.map((p) => `${colX(p.col)},${rowY(p.row)}`).join(' ')}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.path}
          />
        )}
      </svg>

      <div className={styles.resultRow} role="status" aria-live="polite">
        {resultPercent !== null && selected !== null ? (
          <span className={styles.resultText}>
            {selected + 1}번 → <strong>{resultPercent}%</strong>
          </span>
        ) : null}
      </div>

      {revealed && (
        <button type="button" className={styles.restart} onClick={reset}>
          다시하기
        </button>
      )}
    </div>
  );
}
