import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MediaThumb } from './MediaThumb';

const meta: Meta<typeof MediaThumb> = {
  title: 'UI/MediaThumb',
  component: MediaThumb,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MediaThumb>;

const containerStyle = {
  position: 'relative' as const,
  width: 120,
  height: 120,
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  background: 'var(--color-surface-soft)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 48,
};

export const EmojiFallback: Story = {
  render: () => (
    <div style={containerStyle}>
      <MediaThumb src={null} emoji="🏯" sizes="120px" />
    </div>
  ),
};

export const WithAccentDot: Story = {
  render: () => (
    <div style={containerStyle}>
      <MediaThumb src={null} emoji="🌸" sizes="120px">
        <span
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            boxShadow: '0 0 0 2px var(--color-bg)',
          }}
        />
      </MediaThumb>
    </div>
  ),
};
