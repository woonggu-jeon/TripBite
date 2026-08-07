import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon, type IconName } from './';

const meta = {
  title: 'Icon/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: [
        'home',
        'trending-up',
        'flame',
        'flame',
        'trophy',
        'mail',
        'user',
        'bell',
        'settings',
        'location',
        'compass',
        'award',
        'heart-fill',
        'sparkles',
      ] satisfies IconName[],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
  args: { name: 'home', size: 'md' },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const ALL_ICONS: IconName[] = [
  'home',
  'trending-up',
  'trophy',
  'mail',
  'user',
  'bell',
  'settings',
  'chevron-left',
  'chevron-right',
  'check-circle',
  'x-circle',
  'info',
  'alert-triangle',
  'alert-circle',
  'x',
  'wifi-off',
  'sparkles',
  'send',
  'shield-alert',
  'camera',
  'image',
  'location',
  'compass',
  'clock',
  'calendar',
  'parking',
  'globe',
  'ticket',
  'award',
  'heart-fill',
];

export const AllIcons: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 16,
        padding: 16,
      }}
    >
      {ALL_ICONS.map((n) => (
        <div
          key={n}
          style={{ display: 'grid', justifyItems: 'center', gap: 4 }}
        >
          <Icon name={n} size="lg" aria-label={n} />
          <small style={{ color: 'var(--color-muted)' }}>{n}</small>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Icon name="trophy" size="sm" aria-label="sm" />
      <Icon name="trophy" size="md" aria-label="md" />
      <Icon name="trophy" size="lg" aria-label="lg" />
      <Icon name="trophy" size="xl" aria-label="xl" />
    </div>
  ),
};
