import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioOption } from './RadioGroup';

describe('RadioGroup / RadioOption', () => {
  it('role=radiogroup + aria-label 자동', () => {
    render(
      <RadioGroup label="계절 선택">
        <RadioOption checked={false} onSelect={() => {}}>
          봄
        </RadioOption>
      </RadioGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-label',
      '계절 선택',
    );
  });

  it('Tab 의 role=radio + aria-checked 토글', () => {
    render(
      <RadioGroup label="x">
        <RadioOption checked={true} onSelect={() => {}}>
          A
        </RadioOption>
        <RadioOption checked={false} onSelect={() => {}}>
          B
        </RadioOption>
      </RadioGroup>,
    );
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
  });

  it('미선택 RadioOption 클릭 → onSelect 호출', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <RadioGroup label="x">
        <RadioOption checked={false} onSelect={onSelect}>
          A
        </RadioOption>
      </RadioGroup>,
    );
    await user.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('이미 선택된 RadioOption 클릭 → onSelect 호출 X (idempotent)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <RadioGroup label="x">
        <RadioOption checked={true} onSelect={onSelect}>
          A
        </RadioOption>
      </RadioGroup>,
    );
    await user.click(screen.getByRole('radio'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled RadioOption 은 클릭 무시', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <RadioGroup label="x">
        <RadioOption checked={false} onSelect={onSelect} disabled>
          A
        </RadioOption>
      </RadioGroup>,
    );
    await user.click(screen.getByRole('radio'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
