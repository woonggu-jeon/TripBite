import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['surface', 'soft', 'elevated', 'highlighted'],
    },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
  args: {
    variant: 'surface',
    padding: 'md',
    children: '카드 콘텐츠 영역 — 토큰 기반 background / border / radius.',
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Surface: Story = { args: { variant: 'surface' } };
export const Soft: Story = { args: { variant: 'soft' } };
export const Elevated: Story = { args: { variant: 'elevated' } };
export const Highlighted: Story = { args: { variant: 'highlighted' } };
export const SmallPadding: Story = { args: { padding: 'sm' } };
export const LargePadding: Story = { args: { padding: 'lg' } };
