import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils';
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

  // 눈 토글은 NextIntl provider 가 필요해 renderWithProviders 로 렌더한다.
  describe('passwordToggle (Figma eyeIcon)', () => {
    it('토글을 누르면 type 이 password ↔ text 로 바뀌고 라벨도 바뀐다', async () => {
      renderWithProviders(
        <TextField id="pw" label="비밀번호" type="password" passwordToggle />,
      );
      const input = screen.getByLabelText('비밀번호');
      expect(input).toHaveAttribute('type', 'password');

      const btn = screen.getByRole('button', { name: '비밀번호 표시' });
      await userEvent.click(btn);
      expect(screen.getByLabelText('비밀번호')).toHaveAttribute('type', 'text');

      const btn2 = screen.getByRole('button', { name: '비밀번호 숨기기' });
      await userEvent.click(btn2);
      expect(screen.getByLabelText('비밀번호')).toHaveAttribute(
        'type',
        'password',
      );
    });

    it('passwordToggle 없으면 버튼이 렌더되지 않는다', () => {
      render(<TextField id="pw2" label="비밀번호" type="password" />);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });
});
