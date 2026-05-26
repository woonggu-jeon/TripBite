'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUIStore, type Toast } from '@/stores/ui-store';
import styles from './Toaster.module.scss';

/**
 * <Toaster />
 *
 * ui-store 의 toasts 큐를 렌더.
 * Providers 안에 한 번 마운트.
 *
 * 위치: 하단 네비 위 (BottomNav 가려지지 않도록 offset).
 * 데스크톱에선 우상단으로 옮기는 것도 검토 가능.
 *
 * 추후 sonner 도입 시: 이 컴포넌트 + lib/toast.ts 를 sonner adapter 로 교체.
 * 호출부는 그대로.
 */
const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
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
  const Icon = ICONS[toast.type];

  useEffect(() => {
    if (!toast.duration) return;
    const t = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, toast.id, dismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`}>
      <Icon size={18} />
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        aria-label="dismiss"
        className={styles.close}
        onClick={() => dismiss(toast.id)}
      >
        <X size={16} />
      </button>
    </div>
  );
}
