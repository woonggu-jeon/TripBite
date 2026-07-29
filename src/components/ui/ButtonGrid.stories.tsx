import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './Button';
import { ButtonGrid } from './ButtonGrid';

const meta: Meta<typeof ButtonGrid> = {
  title: 'UI/ButtonGrid',
  component: ButtonGrid,
  tags: ['autodocs'],
  argTypes: {
    columns: { control: 'inline-radio', options: [2, 3] },
    gap: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  args: { columns: 2, gap: 'sm' },
};

export default meta;
type Story = StoryObj<typeof ButtonGrid>;

export const TwoColumns: Story = {
  render: (args) => (
    <ButtonGrid {...args}>
      <Button variant="secondary" fullWidth>
        취소
      </Button>
      <Button variant="primary" fullWidth>
        저장
      </Button>
    </ButtonGrid>
  ),
};

export const ThreeColumns: Story = {
  args: { columns: 3 },
  render: (args) => (
    <ButtonGrid {...args}>
      <Button variant="ghost" fullWidth>
        공유
      </Button>
      <Button variant="secondary" fullWidth>
        저장
      </Button>
      <Button variant="primary" fullWidth>
        다음
      </Button>
    </ButtonGrid>
  ),
};
