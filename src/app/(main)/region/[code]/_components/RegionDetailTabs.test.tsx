import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { RegionDetailTabs } from './RegionDetailTabs';

describe('RegionDetailTabs', () => {
  it('4 탭 (all / attraction / festival / experience) 노출 — local 미노출', () => {
    const { container, queryByText } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(4);
    expect(queryByText('지역')).toBeNull();
  });

  it('초기 active 탭 = all', () => {
    const { container } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const selected = container.querySelector('[aria-selected="true"]');
    // Tab 컴포넌트가 id 에 `tab-` prefix 자동 부여 — id="region-all" → "tab-region-all".
    expect(selected?.getAttribute('id')).toBe('tab-region-all');
  });

  it('lazy mount — 초기엔 all panel 만 mount, 다른 탭 panel mount X', () => {
    const { container } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const panels = container.querySelectorAll('[role="tabpanel"]');
    // 초기: 1 개만 mount
    expect(panels.length).toBe(1);
  });
});
