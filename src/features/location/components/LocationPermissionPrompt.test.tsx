import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { LocationPermissionPrompt } from './LocationPermissionPrompt';

describe('LocationPermissionPrompt', () => {
  it('허용 버튼 클릭 시 onAccept 호출', async () => {
    const onAccept = vi.fn();
    renderWithProviders(<LocationPermissionPrompt onAccept={onAccept} />);
    await userEvent.click(screen.getByText('허용하기'));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('onSkip 미지정 시 건너뛰기 버튼 없음', () => {
    renderWithProviders(<LocationPermissionPrompt onAccept={vi.fn()} />);
    expect(screen.queryByText('건너뛰기')).toBeNull();
  });

  it('onSkip 지정 시 건너뛰기 클릭 동작', async () => {
    const onSkip = vi.fn();
    renderWithProviders(
      <LocationPermissionPrompt onAccept={vi.fn()} onSkip={onSkip} />,
    );
    await userEvent.click(screen.getByText('건너뛰기'));
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
