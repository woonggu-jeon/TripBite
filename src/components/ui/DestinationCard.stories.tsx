import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DestinationCard } from './DestinationCard';

const meta = {
  title: 'UI/DestinationCard',
  component: DestinationCard,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['red', 'amber', 'green', 'blue', 'violet'],
    },
  },
  args: {
    href: '#',
    emoji: '🏯',
    tone: 'amber',
    regionLabel: '청주',
    name: '청남대',
    imageUrl: null,
  },
} satisfies Meta<typeof DestinationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithCaption: Story = {
  args: {
    emoji: '🌸',
    regionLabel: '단양',
    name: '봄꽃 축제',
  },
};
export const WithAccentDot: Story = {
  args: { accentDot: '#ff6b6b', name: '저장한 우승지' },
};
export const Tones: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        width: 320,
      }}
    >
      {(['red', 'amber', 'green', 'blue', 'violet'] as const).map((t) => (
        <DestinationCard
          key={t}
          href="#"
          emoji="🏯"
          tone={t}
          regionLabel="청주"
          name={`tone: ${t}`}
        />
      ))}
    </div>
  ),
};
