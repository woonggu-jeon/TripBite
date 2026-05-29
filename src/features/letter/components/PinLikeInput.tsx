'use client';

import { forwardRef, useCallback, useRef, type ChangeEvent } from 'react';
import styles from './PinLikeInput.module.scss';

/**
 * 다섯글자 편지 — PIN 코드처럼 5칸 시각 + 단일 input.
 *
 * 5칸 분리 input 방식은 한국어 IME(자모 조립) / 띄어쓰기 / 특수문자에 취약.
 * 대신 시각만 5칸으로 보이고 실제 입력은 1개 hidden input 으로 받는다.
 *   - 한국어 NFC 1글자 = 1 codepoint → Array.from 으로 안전 split
 *   - 띄어쓰기 / 특수문자 / 이모지 모두 자연스러움
 *   - 키패드는 일반 문자 키패드 (inputMode="text")
 *
 * 5자 제한은 zod schema 가 담당. 이 컴포넌트는 maxLength 만 여유롭게 (NFC 외 path).
 */

export interface PinLikeInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  value: string;
  length?: number;
  /** input id (label 연결용) */
  id?: string;
}

export const PinLikeInput = forwardRef<HTMLInputElement, PinLikeInputProps>(
  function PinLikeInput(
    { value, length = 5, id, onChange, onBlur, name, ...rest },
    forwardedRef,
  ) {
    const localRef = useRef<HTMLInputElement>(null);

    // forwardRef + 내부 ref 동시 지원
    const setRef = useCallback(
      (el: HTMLInputElement | null) => {
        localRef.current = el;
        if (typeof forwardedRef === 'function') forwardedRef(el);
        else if (forwardedRef) forwardedRef.current = el;
      },
      [forwardedRef],
    );

    const chars = Array.from(value);
    const filled = chars.length;

    const handleFocusCells = () => {
      localRef.current?.focus();
    };

    // length 초과 입력 강제 차단 — grapheme(NFC/이모지 surrogate) 단위로 자름.
    // codepoint 기반 maxLength 만으로는 이모지가 surrogate pair 라 5자 검증이 부정확.
    // controlled input 이라 다음 render 에서 clamped value 가 input 에 반영됨.
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const next = Array.from(e.target.value);
      if (next.length > length) {
        e.target.value = next.slice(0, length).join('');
      }
      onChange?.(e);
    };

    return (
      <div
        className={styles.wrap}
        onClick={handleFocusCells}
        role="presentation"
      >
        <div className={styles.cells} aria-hidden>
          {Array.from({ length }).map((_, i) => {
            const ch = chars[i] ?? '';
            const isActive = i === filled;
            const isFilled = i < filled;
            return (
              <div
                key={i}
                className={[
                  styles.cell,
                  isFilled ? styles.filled : '',
                  isActive ? styles.active : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {ch && <span className={styles.char}>{ch}</span>}
              </div>
            );
          })}
        </div>

        <input
          ref={setRef}
          id={id}
          name={name}
          type="text"
          inputMode="text"
          // 모바일 키패드 return 키를 "보내기" 로 표시 (iOS 14+, Android Chrome 77+)
          enterKeyHint="send"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          // 한글 NFC + 띄어쓰기 + 특수문자 + 이모지(surrogate pair) 대비 여유.
          // grapheme 단위 5자 clamp 는 handleChange 가 담당.
          maxLength={20}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          className={styles.input}
          {...rest}
        />
      </div>
    );
  },
);
