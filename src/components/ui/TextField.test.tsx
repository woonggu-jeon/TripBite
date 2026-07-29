import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
  it('label + input 이 htmlFor/id 로 연결됨', () => {
    render(<TextField id="email" label="이메일" />);
    const input = screen.getByLabelText('이메일');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('errorMessage 있을 때 aria-invalid + role=alert', () => {
    render(
      <TextField id="email" label="이메일" errorMessage="형식이 잘못됐어요" />,
    );
    const input = screen.getByLabelText('이메일');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('형식이 잘못됐어요');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('errorMessage 없을 때 aria-invalid 미명시', () => {
    render(<TextField id="email" label="이메일" />);
    const input = screen.getByLabelText('이메일');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('hint 가 있고 error 가 없으면 aria-describedby = hint', () => {
    render(<TextField id="name" label="이름" hint="실명 입력" />);
    const input = screen.getByLabelText('이름');
    expect(input).toHaveAttribute('aria-describedby', 'name-hint');
  });

  it('visuallyHiddenLabel 시 label 노드는 렌더되지만 visually-hidden', () => {
    render(
      <TextField
        id="search"
        label="검색"
        visuallyHiddenLabel
        placeholder="검색어"
      />,
    );
    expect(screen.getByLabelText('검색')).toBeInTheDocument();
  });

  it('ref 가 input 으로 forward 됨', () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField id="x" label="x" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('onChange 호출 — controlled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField id="x" label="x" value="" onChange={onChange} />);
    await user.type(screen.getByLabelText('x'), 'a');
    expect(onChange).toHaveBeenCalled();
  });
});
