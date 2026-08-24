import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('open=false 면 미렌더', () => {
    renderWithProviders(
      <Dialog open={false} onClose={() => {}} title="제목" />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true → role=dialog + aria-modal + aria-labelledby 자동', () => {
    renderWithProviders(<Dialog open onClose={() => {}} title="확인" />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(screen.getByText('확인')).toBeInTheDocument();
  });

  it('description 있을 때 aria-describedby 자동 연결', () => {
    renderWithProviders(
      <Dialog
        open
        onClose={() => {}}
        title="확인"
        description="삭제하시겠어요?"
      />,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('삭제하시겠어요?')).toBeInTheDocument();
  });

  it('ESC → onClose 호출', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Dialog open onClose={onClose} title="x" />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('backdrop click → onClose 호출', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Dialog open onClose={onClose} title="x" />,
    );
    // backdrop = 가장 바깥 div (role="presentation")
    const backdrop = container.querySelector('[role="presentation"]');
    expect(backdrop).toBeTruthy();
    if (backdrop) await user.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });

  it('dialog 내부 click 은 backdrop 으로 bubble 안 됨', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <Dialog open onClose={onClose} title="x">
        <button type="button">action</button>
      </Dialog>,
    );
    await user.click(screen.getByRole('button', { name: 'action' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('icon prop 있을 때 중앙 정렬 header', () => {
    renderWithProviders(
      <Dialog open onClose={() => {}} title="알림" icon={<span>🔔</span>} />,
    );
    expect(screen.getByText('🔔')).toBeInTheDocument();
  });
});
