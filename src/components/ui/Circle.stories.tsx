import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon } from '@/components/icon';
import { Circle } from './Circle';

const meta: Meta<typeof Circle> = {
  title: 'UI/Circle',
  component: Circle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Circle>;

/** Figma `circle` 세트 — 96 / 84 / 72 + circleIcon 46 */
export const FigmaSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
      <Circle size={96} style={{ color: 'var(--color-primary)' }}>
        <Icon name="circle-check" size={46} />
      </Circle>
      <Circle size={84} style={{ color: 'var(--color-primary)' }}>
        <Icon name="circle-check" size={46} />
      </Circle>
      <Circle size={72} style={{ color: 'var(--color-primary)' }}>
        <Icon name="circle-check" size={36} />
      </Circle>
    </div>
  ),
};

/** 화면 실사용 크기 — TournamentHistorySection 40 / SelectCard 54·56 */
export const ScreenSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
      <Circle size={40}>
        <Icon name="trophy-detail" size={20} />
      </Circle>
      <Circle size={54}>
        <Icon name="compass" size={36} />
      </Circle>
      <Circle size={56}>
        <Icon name="compass" size={36} />
      </Circle>
    </div>
  ),
};

/** 면색 인라인 오버라이드 — SelectCard 계절 파스텔(mediaTone) 패턴 */
export const ToneOverride: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Circle size={56} style={{ background: 'var(--accent-spring-surface)' }}>
        🌸
      </Circle>
      <Circle size={56} style={{ background: 'var(--accent-summer-surface)' }}>
        ☀️
      </Circle>
      <Circle size={56} style={{ background: 'var(--accent-autumn-surface)' }}>
        🍂
      </Circle>
      <Circle size={56} style={{ background: 'var(--accent-winter-surface)' }}>
        ❄️
      </Circle>
    </div>
  ),
};
