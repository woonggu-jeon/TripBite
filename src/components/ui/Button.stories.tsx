import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ArrowRight } from 'lucide-react';
import { Icon } from '@/components/icon/Icon';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: '버튼',
    variant: 'primary',
    size: 'md',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Danger: Story = { args: { variant: 'danger', children: '삭제' } };
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const FullWidth: Story = { args: { fullWidth: true, children: '제출' } };
export const Loading: Story = {
  args: { loading: true, children: '저장 중...' },
};
export const WithIcons: Story = {
  args: {
    leadingIcon: <Icon name="heart-fill" size={16} />,
    trailingIcon: <ArrowRight size={16} />,
    children: '좋아요',
  },
};
