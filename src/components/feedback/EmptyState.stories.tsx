import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon } from '@/components/icon/Icon';
import { Button } from '@/components/ui';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  args: {
    icon: <Icon name="mail" size={28} />,
    title: '아직 받은 편지가 없어요',
    description: '편지가 도착하면 여기에 표시돼요',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};
export const WithAction: Story = {
  args: { action: <Button>편지 쓰러 가기</Button> },
};
export const Trophy_: Story = {
  args: {
    icon: <Icon name="award" size={28} />,
    title: '저장된 우승지가 없어요',
    description: '토너먼트를 진행하면 자동 저장돼요',
    action: <Button>토너먼트 시작</Button>,
  },
};
