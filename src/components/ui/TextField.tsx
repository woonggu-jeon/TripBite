'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
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
   * input **내부 우측** overlay slot — 비밀번호 visibility 토글(eye) 등. input
   * 의 padding-right 가 자동으로 늘어 텍스트와 겹치지 않음. 호출 측에서 button
   * 의 type="button" + aria-label 명시.
   */
  trailingAdornment?: ReactNode;
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
      trailingAdornment,
      type = 'text',
      className,
      ...rest
    },
    ref,
  ) {
    const invalid = Boolean(errorMessage);
    const errorId = invalid ? `${id}-error` : undefined;
    const hintId = hint && !invalid ? `${id}-hint` : undefined;
    const describedBy =
      [errorId, hintId].filter(Boolean).join(' ') || undefined;

    const inputClassName = [
      styles.input,
      trailingAdornment ? styles.inputWithAdornment : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const inputEl = (
      <input
        ref={ref}
        id={id}
        type={type}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className={inputClassName}
        {...rest}
      />
    );

    // trailingAdornment 가 있으면 input 을 position:relative wrapper 로 감싸
    // button overlay. suffix 와 trailingAdornment 는 의미가 달라 함께 사용 가능.
    const inputWithAdornment = trailingAdornment ? (
      <div className={styles.inputAdornmentWrap}>
        {inputEl}
        <div className={styles.trailingAdornment}>{trailingAdornment}</div>
      </div>
    ) : (
      inputEl
    );

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
        {suffix ? (
          <div className={styles.inputRow}>
            {inputWithAdornment}
            <div className={styles.suffix}>{suffix}</div>
          </div>
        ) : (
          inputWithAdornment
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
