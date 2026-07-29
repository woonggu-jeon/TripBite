import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Forms/Toggle',
  component: Toggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Interactive: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Toggle checked={on} onChange={setOn} ariaLabel="알림 받기" />
        <span>{on ? '켜짐' : '꺼짐'}</span>
      </div>
    );
  },
};

export const On: Story = {
  render: () => <Toggle checked onChange={() => undefined} ariaLabel="on" />,
};
export const Off: Story = {
  render: () => (
    <Toggle checked={false} onChange={() => undefined} ariaLabel="off" />
  ),
};
export const Disabled: Story = {
  render: () => (
    <Toggle checked disabled onChange={() => undefined} ariaLabel="disabled" />
  ),
};
