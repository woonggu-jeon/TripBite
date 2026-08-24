import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { RadioGroup, RadioOption } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

const OPTIONS = [
  { value: '16', label: '16강' },
  { value: '32', label: '32강' },
  { value: '64', label: '64강' },
];

export const SingleSelect: Story = {
  render: () => {
    const [value, setValue] = useState('32');
    return (
      <RadioGroup label="토너먼트 규모">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OPTIONS.map((o) => (
            <RadioOption
              key={o.value}
              checked={value === o.value}
              onSelect={() => setValue(o.value)}
              className=""
            >
              <span
                style={{
                  padding: '0.5rem 0.875rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  background:
                    value === o.value ? 'var(--color-primary)' : 'transparent',
                  color:
                    value === o.value ? 'var(--color-primary-fg)' : 'inherit',
                  display: 'inline-block',
                }}
              >
                {o.label}
              </span>
            </RadioOption>
          ))}
        </div>
      </RadioGroup>
    );
  },
};
