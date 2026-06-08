'use client';

import { type ReactNode } from 'react';
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

export function TabList({ ariaLabel, className, children }: TabListProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={className}>
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
