import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Tab, TabList, TabPanel } from './Tabs';

const meta: Meta<typeof TabList> = {
  title: 'UI/Tabs',
  component: TabList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TabList>;

const TABS = [
  { key: 'received', label: '받은 편지' },
  { key: 'sent', label: '보낸 편지' },
  { key: 'drafts', label: '임시저장' },
];

export const Basic: Story = {
  render: () => {
    const [active, setActive] = useState<string>('received');
    return (
      <div>
        <TabList ariaLabel="편지 탭">
          <div
            style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {TABS.map((it) => (
              <Tab
                key={it.key}
                id={`letter-${it.key}`}
                selected={active === it.key}
                onSelect={() => setActive(it.key)}
              >
                <span
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderBottom:
                      active === it.key
                        ? '2px solid var(--color-primary)'
                        : '2px solid transparent',
                    color:
                      active === it.key
                        ? 'var(--color-primary)'
                        : 'var(--color-fg)',
                    fontWeight: active === it.key ? 700 : 500,
                  }}
                >
                  {it.label}
                </span>
              </Tab>
            ))}
          </div>
        </TabList>
        <div style={{ padding: '1rem' }}>
          {TABS.map((it) => (
            <TabPanel
              key={it.key}
              id={`letter-${it.key}`}
              selected={active === it.key}
            >
              <p>
                현재 탭: <strong>{it.label}</strong>
              </p>
            </TabPanel>
          ))}
        </div>
      </div>
    );
  },
};
