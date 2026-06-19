'use client';

import { type KeyboardEvent, type ReactNode } from 'react';
import { haptic } from '@/lib/haptic';

/**
 * Tabs primitive — headless (style/layout 자유, content children).
 *
 * a11y (`role="tablist" / role="tab" / role="tabpanel"` + `aria-selected` /
 * `aria-controls` / `aria-labelledby`) 자동 + haptic.tap() + prefetch 콜백 흡수.
 *
 * 사용 패턴:
 *
 *   <TabList ariaLabel={t('section')} className={styles.tabs}>
 *     {TABS.map((it) => (
 *       <Tab
 *         key={it.key}
 *         id={`letter-${it.key}`}
 *         selected={active === it.key}
 *         onSelect={() => selectTab(it.key)}
 *         onPrefetch={() => prefetchTab(it.key)}
 *         className={`${styles.tab} ${active === it.key ? styles.active : ''}`}
 *       >
 *         {t(it.labelKey)}
 *       </Tab>
 *     ))}
 *   </TabList>
 *
 *   <div className={styles.list}>
 *     {TABS.map((it) => (
 *       <TabPanel
 *         key={it.key}
 *         id={`letter-${it.key}`}
 *         selected={active === it.key}
 *         mounted={activated.has(it.key)}
 *         className={styles.panel}
 *       >
 *         <Content />
 *       </TabPanel>
 *     ))}
 *   </div>
 *
 * id 는 페이지 내 unique 면 됨 (TabList wrapper 가 따로 context 만들지 않음).
 * Tab `tab-${id}` ↔ TabPanel `panel-${id}` 자동 연결.
 */

export interface TabListProps {
  /** 스크린리더용 그룹 라벨. */
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

/**
 * 화살표 키 네비게이션 — ARIA APG tabs 패턴 (horizontal).
 *   - ArrowLeft  → 이전 tab focus + click (mutation)
 *   - ArrowRight → 다음 tab focus + click
 *   - Home/End   → 첫 / 마지막 tab
 * roving tabindex 는 미도입 (모든 tab Tab 키로 진입 가능 유지) — 단순 추가
 * 인터랙션. focus 이동 + 자동 onSelect 호출은 ARIA APG 의 automatic activation
 * 패턴 정합.
 */
function handleTabListKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  const key = e.key;
  if (
    key !== 'ArrowLeft' &&
    key !== 'ArrowRight' &&
    key !== 'Home' &&
    key !== 'End'
  )
    return;
  const tabs = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>(
      'button[role="tab"]:not([disabled])',
    ),
  );
  if (tabs.length === 0) return;
  const activeEl = document.activeElement as HTMLButtonElement | null;
  const currentIndex = activeEl ? tabs.indexOf(activeEl) : -1;
  let nextIndex: number;
  if (key === 'Home') nextIndex = 0;
  else if (key === 'End') nextIndex = tabs.length - 1;
  else if (key === 'ArrowLeft')
    nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
  else
    nextIndex =
      currentIndex < 0 || currentIndex === tabs.length - 1
        ? 0
        : currentIndex + 1;
  e.preventDefault();
  const target = tabs[nextIndex];
  if (target) {
    target.focus();
    target.click();
  }
}

export function TabList({ ariaLabel, className, children }: TabListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={className}
      onKeyDown={handleTabListKeyDown}
      // jsx-a11y/interactive-supports-focus 충족용. ARIA APG 상 tablist 자체는
      // focusable 필요 없지만 (자식 button 이 focus 받음), eslint rule 보수.
      // -1 로 Tab 키 진입 안 함 + 자식 button focus 그대로 유지.
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  /** TabPanel 과 매칭할 id (페이지 내 unique). */
  id: string;
  selected: boolean;
  onSelect: () => void;
  /**
   * pointerdown / focus 시 호출 — prefetch 등 latency 흡수.
   * 모바일 터치 다운 ~ 클릭 발사 (100~250ms) 와 키보드 focus 둘 다 매핑.
   */
  onPrefetch?: () => void;
  className?: string;
  children: ReactNode;
}

export function Tab({
  id,
  selected,
  onSelect,
  onPrefetch,
  className,
  children,
}: TabProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={selected}
      aria-controls={`panel-${id}`}
      className={className}
      onClick={() => {
        if (selected) return;
        haptic.tap();
        onSelect();
      }}
      onPointerDown={onPrefetch}
      onFocus={onPrefetch}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  /** Tab 의 id 와 동일 — `panel-${id}` / `tab-${id}` 자동 매핑. */
  id: string;
  selected: boolean;
  /**
   * lazy mount 토글 — 한번이라도 활성화됐던 panel 만 렌더.
   * `false` 면 자식 미렌더 (DOM 자체 없음). `true` + `selected=false` 면 `hidden`.
   * 미지정 시 항상 mount (기본 true).
   */
  mounted?: boolean;
  className?: string;
  children: ReactNode;
}

export function TabPanel({
  id,
  selected,
  mounted = true,
  className,
  children,
}: TabPanelProps) {
  if (!mounted) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!selected}
      className={className}
    >
      {children}
    </div>
  );
}
