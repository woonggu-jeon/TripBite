'use client';

import { useState } from 'react';
import type { Season } from '@/api/generated/schemas';
import styles from './FallingPetals.module.scss';

/**
 * 계절별 파티클 layer (절대 위치 오버레이)
 *
 *   봄 → 🌸 벚꽃잎 (천천히 흔들리며)
 *   여름 → 💧 빗방울 (빠르게 직선)
 *   가을 → 🍂 낙엽 (느리게 회전)
 *   겨울 → ❄️ 눈송이 (가장 천천히, 부드럽게)
 *
 * 부모가 position: relative 인 한 inset:0 으로 채움. pointer-events: none.
 * prefers-reduced-motion 사용자에겐 정적 표시.
 */

const GLYPH: Record<Season, string> = {
  spring: '🌸',
  summer: '💧',
  autumn: '🍂',
  winter: '❄️',
};

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
  return (
    <div className={`${styles.layer} ${styles[season]}`} aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className={styles.particle}
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            ['--sway' as string]: `${p.sway}px`,
            ['--rot' as string]: `${p.rotateStart}deg`,
          }}
        >
          {GLYPH[season]}
        </span>
      ))}
    </div>
  );
}
