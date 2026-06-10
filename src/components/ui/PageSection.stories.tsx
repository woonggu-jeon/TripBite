import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageSection } from './PageSection';

const meta = {
  title: 'UI/PageSection',
  component: PageSection,
  tags: ['autodocs'],
  args: {
    title: '이번주 우승 Top 5',
    hint: '투표 결과 기반',
    children: (
      <p style={{ color: 'var(--color-muted)' }}>본문 영역 placeholder</p>
    ),
  },
} satisfies Meta<typeof PageSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: {
    action: (
      <button
        type="button"
        style={{
          color: 'var(--color-primary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        전체 →
      </button>
    ),
  },
};
export const TitleOnly: Story = { args: { hint: undefined } };
export const H3: Story = { args: { level: 'h3' } };
