import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { RegionDetailTabs } from './RegionDetailTabs';

describe('RegionDetailTabs', () => {
  it('3 탭 (attraction / festival / experience) 노출 — local 미노출', () => {
    const { container, queryByText } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    // local 탭은 정책상 미노출 (BE swagger 의 enum cleanup 전까지 type 안전망)
    expect(queryByText('지역')).toBeNull();
  });

  it('초기 active 탭 = attraction', () => {
    const { container } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const selected = container.querySelector('[aria-selected="true"]');
    // Tab 컴포넌트가 id 에 `tab-` prefix 자동 부여 — RegionDetailTabs.tsx 의
    // id="region-attraction" → DOM 의 id="tab-region-attraction".
    expect(selected?.getAttribute('id')).toBe('tab-region-attraction');
  });

  it('lazy mount — 초기엔 attraction panel 만 mount, 다른 탭 panel mount X', () => {
    const { container } = renderWithProviders(
      <RegionDetailTabs code="cheongju" />,
    );
    const panels = container.querySelectorAll('[role="tabpanel"]');
    // 초기: 1 개만 mount
    expect(panels.length).toBe(1);
  });
});
