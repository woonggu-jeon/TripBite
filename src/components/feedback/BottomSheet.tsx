'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useKeyboard } from '@/hooks/use-keyboard';
import styles from './BottomSheet.module.scss';

/**
 * <BottomSheet />
 *
 * iOS / Android 패턴의 bottom sheet primitive — backdrop + slide-up + handle
 * + title/description + children (옵션 row 등) + cancel button.
 *
 * Figma "MY_01 · 마이페이지 (프로필 사진 변경)" 정합 (2026-06-23):
 *   - dim overlay rgba(0,0,0,0.42)
 *   - sheet 360 max-width + radius 22 top + bg white
 *   - handle 80×4 #E0E0E0 (10 px top padding)
 *   - header Frame 16: title B_16 + caption R_12 fg (column gap 4 padding 12/20)
 *   - opt row 64h padding 12/20 gap 12 (40 circle primary-soft + label SB_14)
 *   - cancel wrap 92h padding 20 (320×52 outline button)
 *
 * a11y: ESC + backdrop click + focus trap.
 */
export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  cancelLabel?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  cancelLabel = '취소',
  className,
}: BottomSheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const titleId = `bs-${reactId}-title`;
  const descId = description ? `bs-${reactId}-desc` : undefined;

  useFocusTrap(ref, open);
  useKeyboard('Escape', onClose, { enabled: open });

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={className ? `${styles.sheet} ${className}` : styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handleWrap} aria-hidden>
          <span className={styles.handle} />
        </div>

        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && (
            <p id={descId} className={styles.description}>
              {description}
            </p>
          )}
        </div>

        <div className={styles.options}>{children}</div>

        <div className={styles.cancelWrap}>
          <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
