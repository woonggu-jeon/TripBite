import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Interactive: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id="age14" checked={on} onChange={setOn} />
        <label htmlFor="age14">만 14세 이상입니다</label>
      </div>
    );
  },
};

export const On: Story = {
  render: () => <Checkbox checked onChange={() => undefined} ariaLabel="on" />,
};
export const Off: Story = {
  render: () => (
    <Checkbox checked={false} onChange={() => undefined} ariaLabel="off" />
  ),
};
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Checkbox
        checked
        disabled
        onChange={() => undefined}
        ariaLabel="disabled on"
      />
      <Checkbox
        checked={false}
        disabled
        onChange={() => undefined}
        ariaLabel="disabled off"
      />
    </div>
  ),
};
