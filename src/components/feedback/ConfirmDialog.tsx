'use client';

import { useRef } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useKeyboard } from '@/hooks/use-keyboard';
import { Button } from '@/components/ui';
import styles from './ConfirmDialog.module.scss';

/**
 * <ConfirmDialog />
 *
 * Providers 안에 한 번 마운트.
 * useConfirm() 으로 큐 push 되면 자동 렌더.
 *
 * 한 번에 하나만 (큐의 첫 번째). 동시 호출 시 순차 처리.
 *
 * 접근성:
 *   - aria-labelledby + aria-describedby
 *   - Esc 로 cancel
 *   - 포커스 트랩 — Tab 이 다이얼로그 밖으로 안 나감
 *   - 닫힐 때 이전 포커스로 복원
 */
export function ConfirmDialog() {
  const current = useUIStore((s) => s.confirms[0]);
  const resolve = useUIStore((s) => s.resolveConfirm);
  const ref = useRef<HTMLDivElement>(null);

  useFocusTrap(ref, !!current);
  useKeyboard('Escape', () => current && resolve(current.id, false), {
    enabled: !!current,
  });

  if (!current) return null;

  const {
    id,
    title,
    description,
    confirmLabel = '확인',
    cancelLabel = '취소',
    destructive,
  } = current;

  return (
    // backdrop click = cancel. 키보드 인터랙션은 Esc 가 useKeyboard 로 이미 처리.
    // role="presentation" 으로 backdrop 이 의미상 dialog 의 보조 영역임을 명시.
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={() => resolve(id, false)}
    >
      {/* dialog 내부 click 의 backdrop 으로의 bubbling 차단. 키보드 인터랙션은
          내부 Button 들이 제공. role="dialog" + aria-modal 로 의도 명시. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`confirm-${id}-title`}
        aria-describedby={description ? `confirm-${id}-desc` : undefined}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={`confirm-${id}-title`} className={styles.title}>
          {title}
        </h2>
        {description && (
          <p id={`confirm-${id}-desc`} className={styles.description}>
            {description}
          </p>
        )}
        <div className={styles.actions}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => resolve(id, false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            fullWidth
            onClick={() => resolve(id, true)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
