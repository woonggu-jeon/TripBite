'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useKeyboard } from '@/hooks/use-keyboard';
import { IconButton } from './IconButton';
import styles from './Dialog.module.scss';

export interface DialogProps {
  /** 열림 여부. false 면 미렌더. */
  open: boolean;
  /** ESC / backdrop click / 우상단 X 버튼 공통 close 콜백. */
  onClose: () => void;
  /** aria-labelledby 자동 연결. */
  title: ReactNode;
  /** aria-describedby 자동 연결 (옵션). */
  description?: ReactNode;
  /** 자유 본문 (form 등) — title/description 아래에 렌더. */
  children?: ReactNode;
  /** footer 영역 — Button 등. */
  actions?: ReactNode;
  /** 우상단 X 버튼 노출 (옵션). 알림형 dialog 는 false 권장. */
  showCloseButton?: boolean;
  /** title 위 중앙 아이콘 (옵션) — LocationPermissionPrompt 같은 알림형. */
  icon?: ReactNode;
}

/**
 * Dialog primitive — backdrop + ESC + focus trap + a11y 자동 연결.
 *
 * 3 사용처 (ConfirmDialog 큐 / NicknameEditDialog / ChangePasswordDialog) 가
 * 동일 backdrop+dialog 패턴 반복했던 것을 흡수.
 *
 * 디자인 교체 시 본 primitive 의 SCSS 토큰만 수정하면 모든 모달 일괄 갱신.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  showCloseButton,
  icon,
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tCommon = useTranslations('common');
  const reactId = useId();
  const titleId = `dialog-${reactId}-title`;
  const descId = description ? `dialog-${reactId}-desc` : undefined;

  useFocusTrap(ref, open);
  useKeyboard('Escape', onClose, { enabled: open });

  // body scroll lock — modal 뒤 콘텐츠 스크롤 차단. iOS PWA 에서 dialog 안
  // 스와이프가 body 로 chain 되는 문제 + 모달 외부 클릭 의도 명확화.
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
      {/* dialog click 의 backdrop bubbling 차단. 키보드 인터랙션은 내부 actions/IconButton 이 제공.
          role="dialog" + aria-modal 로 의도 명시. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        {icon ? (
          <div className={styles.headerWithIcon}>
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {showCloseButton && (
                <IconButton
                  aria-label={tCommon('close')}
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X size={16} aria-hidden />
                </IconButton>
              )}
            </div>
            {description && (
              <p id={descId} className={styles.description}>
                {description}
              </p>
            )}
          </>
        )}

        {children}

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
