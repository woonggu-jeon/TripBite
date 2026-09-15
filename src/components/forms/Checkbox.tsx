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
 *   그 두 심볼은 이제 **정상**이다. build-icons 의 `colors` 맵이 색마다 CSS
 *   토큰을 물려서 다크 테마까지 따라오고, 20px 실측 결과 아래 CSS 박스와
 *   픽셀 단위로 동일하다 (docs/design/FIGMA_CROSSCHECK.md §3-2).
 *   그래도 CSS 박스를 유지하는 이유는 두 가지뿐이다:
 *     1) on/off 전환 트랜지션 — 심볼 교체(`<use href>`)는 보간이 안 된다.
 *     2) 콜드 캐시 첫 페인트 — 외부 sprite 가 도착할 때까지 박스가 빈 칸으로
 *        남는다. 동의 체크박스는 신규 사용자의 **첫 화면**이라 이게 크다.
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
