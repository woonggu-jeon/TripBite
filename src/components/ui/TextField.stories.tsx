import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextField } from './TextField';

const meta = {
  title: 'UI/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    id: 'tf-sample',
    label: '이메일',
    placeholder: 'you@example.com',
  },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: '회원가입 시 사용한 이메일' } };
export const Invalid: Story = {
  args: { errorMessage: '이메일 형식이 올바르지 않아요', defaultValue: 'bad@' },
};
export const Password: Story = {
  args: {
    id: 'tf-pw',
    label: '비밀번호',
    type: 'password',
    placeholder: '8자 이상',
  },
};
export const VisuallyHiddenLabel: Story = {
  args: { visuallyHiddenLabel: true, placeholder: '검색어 입력' },
};
