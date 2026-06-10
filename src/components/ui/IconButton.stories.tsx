import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heart, X, Settings } from 'lucide-react';
import { IconButton } from './IconButton';

const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['ghost', 'solid', 'outline'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Like',
    variant: 'ghost',
    size: 'md',
    children: <Heart size={20} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ghost: Story = {};
export const Solid: Story = { args: { variant: 'solid' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <IconButton aria-label="close" size="sm" variant="ghost">
        <X size={14} />
      </IconButton>
      <IconButton aria-label="close" size="md" variant="ghost">
        <X size={16} />
      </IconButton>
      <IconButton aria-label="close" size="lg" variant="ghost">
        <X size={20} />
      </IconButton>
    </div>
  ),
};
export const Settings_: Story = {
  args: {
    'aria-label': 'Settings',
    children: <Settings size={20} />,
    variant: 'outline',
  },
};
