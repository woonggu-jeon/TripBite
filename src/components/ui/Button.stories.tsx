import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heart, ArrowRight, Plus } from 'lucide-react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'ghost',
        'danger',
        'figma-green-solid',
        'figma-green-line',
        'figma-gray-line',
      ],
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
    leadingIcon: <Heart size={16} />,
    trailingIcon: <ArrowRight size={16} />,
    children: '좋아요',
  },
};

// ===== Figma 디자인 시도 (feat/figma-button-test, 2026-06-19) =====
// Figma "button" componentSet — size=52px / radius 12px / Pretendard Medium 16px
// 6 matrix 시연 — 원복 시 본 stories + variant union + .v-figma-* SCSS 만 삭제.

export const FigmaGreenSolid: Story = {
  args: {
    variant: 'figma-green-solid',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
  },
};

export const FigmaGreenIcon: Story = {
  args: {
    variant: 'figma-green-solid',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
    leadingIcon: <Plus size={16} />,
  },
};

export const FigmaGreenLine: Story = {
  args: {
    variant: 'figma-green-line',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
  },
};

export const FigmaGrayLine: Story = {
  args: {
    variant: 'figma-gray-line',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
  },
};

export const FigmaDisabledSolid: Story = {
  args: {
    variant: 'figma-green-solid',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
    disabled: true,
  },
};

export const FigmaDisabledLine: Story = {
  args: {
    variant: 'figma-gray-line',
    size: 'lg',
    children: 'Text',
    fullWidth: true,
    disabled: true,
  },
};
