import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DestinationCard } from './DestinationCard';

const meta = {
  title: 'UI/DestinationCard',
  component: DestinationCard,
  tags: ['autodocs'],
  args: {
    href: '#',
    emoji: '🏯',
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

/**
 * 2열 그리드 — 이름 길이에 따른 높이 고정(2줄) 확인용.
 * 톤(시군별 색) variant 는 폐기됐다 — hover 강조는 브랜드 초록 하나다.
 */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        width: 320,
      }}
    >
      {['청남대', '만천하 스카이워크', '속리산 법주사', '대청호'].map(
        (name) => (
          <DestinationCard
            key={name}
            href="#"
            emoji="🏯"
            regionLabel="청주"
            name={name}
          />
        ),
      )}
    </div>
  ),
};
