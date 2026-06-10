import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    radius: { control: 'select', options: ['sm', 'md', 'lg', 'full'] },
  },
  args: { width: '60%', height: 20, radius: 'md' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};
export const CardSkeleton: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8, width: 320 }}>
      <Skeleton width="100%" height={180} radius="lg" />
      <Skeleton width="40%" height={14} radius="sm" />
      <Skeleton width="80%" height={20} radius="sm" />
      <Skeleton width="60%" height={14} radius="sm" />
    </div>
  ),
};
export const Avatar: Story = {
  args: { width: 48, height: 48, radius: 'full' },
};
