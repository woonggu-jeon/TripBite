import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils';
import { DdayBadge } from './DdayBadge';

describe('DdayBadge', () => {
  it('daysToStart=1 → "D-1" 라벨', () => {
    const { getByText } = renderWithProviders(<DdayBadge daysToStart={1} />);
    expect(getByText('D-1')).toBeInTheDocument();
  });

  it('daysToStart=30 → "D-30" 라벨', () => {
    const { getByText } = renderWithProviders(<DdayBadge daysToStart={30} />);
    expect(getByText('D-30')).toBeInTheDocument();
  });

  it('aria-label 에 "{n}일 후 시작" 포함', () => {
    const { container } = renderWithProviders(<DdayBadge daysToStart={7} />);
    const badge = container.querySelector('[aria-label]');
    expect(badge?.getAttribute('aria-label')).toMatch(/7/);
  });
});
