'use client';

import { useState } from 'react';
import type { Season } from '@/types/api-domain';
import { seasonIllustration } from '@/constants/illustration-map';
import styles from './FallingPetals.module.scss';

/**
 * 계절별 파티클 layer (절대 위치 오버레이)
 *
 * 파티클 그림은 Figma `seasonIcon` 에셋을 쓴다 — 계절 카드·로딩 화면의 아이콘과
 * 같은 그림이어야 한다. 구 구현은 OS 이모지(🌸 💧 🍂 ❄️) 라, 여름 아이콘이
 * 시안의 태양이 아니라 빗방울로 나왔다.
 *
 * 낙하 속도/궤적만 계절별로 다르게 유지:
 *   봄·가을 → 천천히 흔들리며 회전
 *   여름   → 빠르게 직선
 *   겨울   → 가장 천천히, 부드럽게
 *
 * 부모가 position: relative 인 한 inset:0 으로 채움. pointer-events: none.
 * prefers-reduced-motion 사용자에겐 정적 표시.
 */

interface Particle {
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotateStart: number;
  sway: number;
}

function generate(count: number, season: Season): Particle[] {
  // 계절별 기본 지속시간 분포
  const base = season === 'summer' ? 2.5 : season === 'winter' ? 11 : 8;
  const jitter = season === 'summer' ? 1.5 : season === 'winter' ? 5 : 4;
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * base,
    duration: base + Math.random() * jitter,
    size: 0.7 + Math.random() * 0.7,
    rotateStart: Math.random() * 360,
    sway: (Math.random() - 0.5) * 80,
  }));
}

export interface FallingPetalsProps {
  season: Season;
  count?: number;
  active?: boolean;
}

export function FallingPetals({
  season,
  count = 22,
  active = true,
}: FallingPetalsProps) {
  // 마운트 시 한 번만 생성 — SSR/CSR hydration 안전 (use client)
  const [particles] = useState<Particle[]>(() => generate(count, season));
  if (!active) return null;
  const art = seasonIllustration(season);
  if (!art) return null;
  return (
    <div
      className={`${styles.layer} ${styles[season]}`}
      style={{ ['--particle-img' as string]: `url(/illustrations/${art}.png)` }}
      aria-hidden
    >
      {particles.map((p, i) => (
        <span
          key={i}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ['--p-size' as string]: `${p.size}rem`,
            ['--sway' as string]: `${p.sway}px`,
            ['--rot' as string]: `${p.rotateStart}deg`,
          }}
        />
      ))}
    </div>
  );
}
