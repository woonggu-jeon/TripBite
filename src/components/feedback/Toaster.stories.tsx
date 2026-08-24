import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '@/components/ui';
import { toast } from '@/lib/toast';
import { Toaster } from './Toaster';

const meta = {
  title: 'Feedback/Toast',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Imperative: Story = {
  render: () => (
    <div style={{ padding: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Toaster />
      <Button onClick={() => toast.success('저장되었어요')}>success</Button>
      <Button variant="danger" onClick={() => toast.error('실패했어요')}>
        error
      </Button>
      <Button variant="secondary" onClick={() => toast.info('새 알림')}>
        info
      </Button>
      <Button variant="ghost" onClick={() => toast.warning('주의')}>
        warning
      </Button>
    </div>
  ),
};
