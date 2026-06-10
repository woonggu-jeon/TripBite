import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chip } from './Chip';

const meta = {
  title: 'UI/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'outline', 'subtle', 'solid'],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    pill: { control: 'boolean' },
  },
  args: { variant: 'default', size: 'md', pill: true, children: '#태그' },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { variant: 'default' } };
export const Primary: Story = { args: { variant: 'primary' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Subtle: Story = { args: { variant: 'subtle' } };
export const Solid: Story = { args: { variant: 'solid', children: 'HOT' } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Chip size="xs">NEW</Chip>
      <Chip size="sm">#청주</Chip>
      <Chip size="md">기본</Chip>
    </div>
  ),
};
