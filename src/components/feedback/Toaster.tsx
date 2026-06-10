'use client';

import { useEffect } from 'react';
import { Icon, type IconName } from '@/components/icon';
import { useUIStore, type Toast } from '@/stores/ui-store';
import styles from './Toaster.module.scss';

/**
 * <Toaster />
 *
 * 변경: lucide-react → SVG sprite (<Icon />)
 * 토스트는 어느 페이지에서든 표시되므로 메인 번들이 아닌 sprite 사용이 핵심.
 *
 * 위치: 하단 네비 위 (BottomNav 가려지지 않도록 offset).
 */
const ICONS: Record<Toast['type'], IconName> = {
  success: 'check-circle',
  error: 'x-circle',
  info: 'info',
  warning: 'alert-triangle',
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);

  return (
    <div className={styles.region} role="status" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUIStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast.duration) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, toast.id, dismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <Icon name={ICONS[toast.type]} size="sm" />
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        aria-label="dismiss"
        className={styles.close}
        onClick={() => dismiss(toast.id)}
      >
        <Icon name="x" size="sm" />
      </button>
    </div>
  );
}
