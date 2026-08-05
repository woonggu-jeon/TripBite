import type { ReactNode } from 'react';
import styles from './LetterPaper.module.scss';

/**
 * 편지 카드 — Figma `Frame 79` (받은 편지 상세 / 편지 발송완료 공통).
 *
 *   ┌───────────────────────────────────┐  #F6F6F6 + 1px #E0E0E0, r12
 *   │ [사진60 + 도장62]  FROM / 보낸이   │  top   H gap 12
 *   │ ┌──┬──┬──┬──┬──┐                  │  5칸, 칸마다 흰 면 + 빨간 보더
 *   │ └──┴──┴──┴──┴──┘                  │
 *   │ ────────────────                  │  divider
 *   │ TO 받는이 / 2026.08.05 도착        │  footer V gap 4
 *   └───────────────────────────────────┘
 *
 * 두 화면이 같은 카드를 쓰므로 한 컴포넌트로 둔다. 도장 라벨/받는이/날짜 문구만
 * 화면마다 다르다.
 */
export function LetterPaper({
  ariaLabel,
  postmarkLabel,
  postmarkName,
  fromLabel,
  fromName,
  body,
  toLabel,
  toName,
  dateText,
}: {
  ariaLabel: string;
  /** 도장 위쪽 작은 라벨 (도착 / 전송 등) */
  postmarkLabel: string;
  /** 도장 아래 지역명 */
  postmarkName?: string;
  fromLabel: string;
  fromName: string;
  /** 다섯 글자 본문 — 5칸 고정, 부족하면 빈 칸 */
  body: string;
  toLabel: string;
  toName: string;
  /** 카드 하단 날짜 줄 (이미 조합된 문자열) */
  dateText: ReactNode;
}) {
  const cells = Array.from({ length: 5 }, (_, i) => [...body][i] ?? '');

  return (
    <article className={styles.card} aria-label={ariaLabel}>
      <div className={styles.top}>
        {/* Figma `pw` — 60 사진 위에 원형 도장이 겹친다 */}
        <div className={styles.postmarkWrap} aria-hidden>
          <span className={styles.photo} />
          <span className={styles.postmark}>
            <span className={styles.postmarkLabel}>{postmarkLabel}</span>
            {postmarkName && (
              <span className={styles.postmarkName}>{postmarkName}</span>
            )}
          </span>
        </div>
        <div className={styles.meta}>
          <p className={styles.metaLabel}>{fromLabel}</p>
          <p className={styles.metaValue}>{fromName}</p>
        </div>
      </div>

      {/* Figma `letterBox` — 5칸 */}
      <div className={styles.letterBox} aria-label={body}>
        {cells.map((ch, i) => (
          <span key={i} className={styles.cell} aria-hidden>
            {ch}
          </span>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.divider} aria-hidden />
        <div className={styles.footerText}>
          <p className={styles.toRow}>
            <span className={styles.metaLabel}>{toLabel}</span>
            <span className={styles.toName}>{toName}</span>
          </p>
          <p className={styles.dateText}>{dateText}</p>
        </div>
      </div>
    </article>
  );
}
