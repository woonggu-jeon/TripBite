'use client';

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { EyeGlyph } from '@/components/icon';
import styles from './TextField.module.scss';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id'
> {
  /** label htmlFor 와 input id 연결 — 반드시 명시. */
  id: string;
  /** 표시할 라벨. 미지정 시 label 노드 자체를 렌더하지 않음. */
  label?: ReactNode;
  /** 표시할 에러 메시지 (이미 i18n 변환된 문자열). undefined / null 이면 정상. */
  errorMessage?: string | null;
  /** 라벨을 시각적으로 가리되 스크린리더 노출 (placeholder/aria-label 로 의미 전달 시). */
  visuallyHiddenLabel?: boolean;
  /** 보조 설명 — invalid 가 아닐 때만 노출. aria-describedby 로 자동 연결. */
  hint?: ReactNode;
  /**
   * input 우측에 inline 배치되는 슬롯 — 중복확인 버튼 등. label / error 행과
   * 무관하게 input row 와 같은 줄에 정렬되어 시각 안정. (호출 측에서 button 의
   * type="button" 명시 — submit 차단.)
   */
  suffix?: ReactNode;
  /**
   * `type="password"` 입력 안쪽 우측에 눈 토글을 붙인다 (Figma `eyeIcon`).
   * 누르면 type 이 password ↔ text 로 바뀐다.
   *
   * `suffix` 와 동시에 쓰지 않는다 — suffix 는 입력 **밖** 우측 슬롯이고
   * 토글은 입력 **안** 이라 서로 자리를 다투지 않지만, 한 입력에 둘 다 붙는
   * 시안이 없어 조합을 지원하지 않는다.
   */
  passwordToggle?: boolean;
}

/**
 * 폼 텍스트 입력 primitive — label + input + error + a11y 연결을 한 곳에서 관리.
 *
 * - `aria-invalid` 는 boolean → undefined 로 매핑(JSX 정적분석 false-positive 회피, render 동등).
 * - `aria-describedby` 가 hint/error id 를 자동 연결.
 * - register/controlled 모두 ...rest 로 통과.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      id,
      label,
      errorMessage,
      visuallyHiddenLabel,
      hint,
      suffix,
      passwordToggle,
      type = 'text',
      className,
      ...rest
    },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    // 토글이 켜져 있으면 실제 type 은 상태에 따라 바뀐다.
    const effectiveType =
      passwordToggle && type === 'password' && revealed ? 'text' : type;
    const invalid = Boolean(errorMessage);
    const errorId = invalid ? `${id}-error` : undefined;
    const hintId = hint && !invalid ? `${id}-hint` : undefined;
    const describedBy =
      [errorId, hintId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={styles.field}>
        {label !== undefined && label !== null && label !== '' && (
          <label
            htmlFor={id}
            className={visuallyHiddenLabel ? styles.labelHidden : styles.label}
          >
            {label}
          </label>
        )}
        {passwordToggle ? (
          <div className={styles.inputWrap}>
            <input
              ref={ref}
              id={id}
              type={effectiveType}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={describedBy}
              className={[styles.input, styles.hasToggle, className]
                .filter(Boolean)
                .join(' ')}
              {...rest}
            />
            {/* Figma 는 입력 박스 안쪽 우측 16px 지점에 20px 눈 아이콘을 둔다 */}
            <RevealButton
              revealed={revealed}
              onToggle={() => setRevealed((v) => !v)}
            />
          </div>
        ) : suffix ? (
          <div className={styles.inputRow}>
            <input
              ref={ref}
              id={id}
              type={type}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={describedBy}
              className={
                className ? `${styles.input} ${className}` : styles.input
              }
              {...rest}
            />
            <div className={styles.suffix}>{suffix}</div>
          </div>
        ) : (
          <input
            ref={ref}
            id={id}
            type={type}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={describedBy}
            className={
              className ? `${styles.input} ${className}` : styles.input
            }
            {...rest}
          />
        )}
        {hint && !invalid && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
        {invalid && (
          <p id={errorId} className={styles.error} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

/**
 * 비밀번호 표시 토글 버튼.
 *
 * `useTranslations` 를 TextField 본체가 아니라 여기서 부르는 이유: 토글을 쓰지
 * 않는 입력이 대부분이고, 본체에서 훅을 부르면 NextIntl provider 없이
 * TextField 를 렌더하는 테스트가 전부 깨진다. 토글이 켜질 때만 마운트된다.
 */
function RevealButton({
  revealed,
  onToggle,
}: {
  revealed: boolean;
  onToggle: () => void;
}) {
  const tCommon = useTranslations('common');
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={revealed ? tCommon('hidePassword') : tCommon('showPassword')}
      data-revealed={revealed ? 'true' : 'false'}
    >
      <EyeGlyph size={20} />
    </button>
  );
}
