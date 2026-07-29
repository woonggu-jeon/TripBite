'use client';

import { Button, Dialog } from '@/components/ui';
import { useUIStore } from '@/stores/ui-store';
import styles from './ConfirmDialog.module.scss';

/**
 * <ConfirmDialog />
 *
 * Providers 안에 한 번 마운트. useConfirm() 의 큐 push 시 자동 렌더.
 * 한 번에 하나만 (큐의 첫 번째). 동시 호출 시 순차 처리.
 *
 * a11y / focus trap / ESC 등은 Dialog primitive (`@/components/ui/Dialog`) 가 담당.
 * 본 컴포넌트는 큐 ↔ Dialog 어댑터.
 */
export function ConfirmDialog() {
  const current = useUIStore((s) => s.confirms[0]);
  const resolve = useUIStore((s) => s.resolveConfirm);

  if (!current) return null;

  const {
    id,
    title,
    description,
    confirmLabel = '확인',
    cancelLabel = '취소',
  } = current;

  // Figma "MY · 우승지 삭제" modal (2026-06-23) — confirm button bg primary
  // (#00B334) green. 이전 destructive 시 'danger' (red) 회귀 정정 — 일관 primary.
  // destructive prop 자체는 store schema 유지 (useConfirm 호출자 호환) — 시각
  // 분기 안 함.

  return (
    <Dialog
      open
      onClose={() => resolve(id, false)}
      title={title}
      description={description}
      className={styles.confirmDialog}
      actions={
        <>
          <Button
            variant="outline"
            fullWidth
            onClick={() => resolve(id, false)}
          >
            {cancelLabel}
          </Button>
          <Button variant="primary" fullWidth onClick={() => resolve(id, true)}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
