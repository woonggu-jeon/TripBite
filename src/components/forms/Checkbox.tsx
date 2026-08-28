'use client';

import type { ChangeEvent, FocusEvent } from 'react';
import { Icon } from '@/components/icon/Icon';
import { haptic } from '@/lib/haptic';
import styles from './Checkbox.module.scss';

/**
 * 체크박스 primitive — Figma `checkbox` (node 3450:2290) 정합.
 *
 * 시안 실측:
 *   - 20×20, radius 4
 *   - off : bg white + 1px #E0E0E0 border
 *   - on  : bg primary(#00B334) + white 체크 (stroke 2.8, linecap round)
 *
 * 구현 노트 — 왜 sprite 의 `checkbox-on`/`checkbox-off` 를 쓰지 않는가:
 *   그 두 심볼은 박스와 체크가 **한 SVG 안 2색**인데, build-icons 의
 *   COLOR_PATTERN 이 흰색·primary 를 모두 `currentColor` 로 치환해 버려
 *   박스와 체크가 같은 색이 된다(= 체크 안 보임). 또 off 의 border 는
 *   `#E0E0E0` 하드코딩이라 다크 테마에 못 따라온다.
 *   → 박스는 CSS 토큰으로, 체크만 단색 글리프(`check-20`)로 그린다.
 *
 * a11y: 네이티브 `<input type="checkbox">` 를 그대로 유지(투명 오버레이)해
 * 폼 참여·키보드·스크린리더 동작을 손대지 않는다. 라벨은 호출부가 감싸는
 * `<label>` 로 연결하거나 `ariaLabel` 을 넘긴다.
 */
export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** react-hook-form Controller 연동용 */
  id?: string;
  name?: string;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  /** 감싸는 <label> 이 없을 때 필수 */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  onBlur,
  ariaLabel,
  ariaDescribedBy,
  className,
}: CheckboxProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    haptic.tap();
    onChange(e.target.checked);
  }

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        id={id}
        name={name}
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      />
      <span className={styles.box} aria-hidden="true">
        <Icon name="check-20" size={20} className={styles.check} />
      </span>
    </span>
  );
}
