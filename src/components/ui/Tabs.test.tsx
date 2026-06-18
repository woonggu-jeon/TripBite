import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabList, Tab, TabPanel } from './Tabs';

describe('TabList / Tab / TabPanel', () => {
  it('TabList role=tablist + aria-label', () => {
    render(
      <TabList ariaLabel="섹션">
        <Tab id="a" selected onSelect={() => {}}>
          A
        </Tab>
      </TabList>,
    );
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', '섹션');
  });

  it('Tab role=tab + aria-selected + aria-controls 자동', () => {
    render(
      <TabList ariaLabel="x">
        <Tab id="alpha" selected onSelect={() => {}}>
          A
        </Tab>
      </TabList>,
    );
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-controls', 'panel-alpha');
    expect(tab).toHaveAttribute('id', 'tab-alpha');
  });

  it('미선택 Tab 클릭 → onSelect 호출', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <TabList ariaLabel="x">
        <Tab id="a" selected={false} onSelect={onSelect}>
          A
        </Tab>
      </TabList>,
    );
    await user.click(screen.getByRole('tab'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('이미 선택된 Tab 재클릭 → onSelect 호출 X', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <TabList ariaLabel="x">
        <Tab id="a" selected onSelect={onSelect}>
          A
        </Tab>
      </TabList>,
    );
    await user.click(screen.getByRole('tab'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('onPrefetch 가 pointerdown + focus 둘 다 호출', async () => {
    const onPrefetch = vi.fn();
    const user = userEvent.setup();
    render(
      <TabList ariaLabel="x">
        <Tab
          id="a"
          selected={false}
          onSelect={() => {}}
          onPrefetch={onPrefetch}
        >
          A
        </Tab>
      </TabList>,
    );
    const tab = screen.getByRole('tab');
    tab.focus();
    expect(onPrefetch).toHaveBeenCalled();
    onPrefetch.mockClear();
    await user.pointer({ keys: '[MouseLeft>]', target: tab });
    expect(onPrefetch).toHaveBeenCalled();
  });

  it('TabPanel mounted=false → DOM 미렌더', () => {
    render(
      <TabPanel id="a" selected={false} mounted={false}>
        hidden
      </TabPanel>,
    );
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('TabPanel mounted=true selected=false → hidden 속성', () => {
    render(
      <TabPanel id="a" selected={false} mounted>
        content
      </TabPanel>,
    );
    // hidden=true (DOM 의 hidden 속성) — role query 가 hidden 노드까지 포함
    const tabpanel = screen.getByRole('tabpanel', { hidden: true });
    expect(tabpanel).toHaveAttribute('hidden');
  });

  it('TabPanel role=tabpanel + aria-labelledby + id 자동', () => {
    render(
      <TabPanel id="alpha" selected mounted>
        content
      </TabPanel>,
    );
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-alpha');
    expect(panel).toHaveAttribute('id', 'panel-alpha');
  });
});
