import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaThumb } from './MediaThumb';

describe('MediaThumb', () => {
  it('src 있을 때 <img> 렌더 (next/image)', () => {
    const { container } = render(
      <MediaThumb
        src="https://tong.visitkorea.or.kr/x.jpg"
        emoji="🏆"
        sizes="96px"
      />,
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('src 없을 때 emoji 렌더', () => {
    render(<MediaThumb src={null} emoji="🎪" sizes="56px" />);
    expect(screen.getByText('🎪')).toBeInTheDocument();
  });

  it('src 빈 string 도 emoji fallback', () => {
    render(<MediaThumb src="" emoji="📍" sizes="40px" />);
    expect(screen.getByText('📍')).toBeInTheDocument();
  });

  it('children (overlay) 가 함께 렌더', () => {
    render(
      <MediaThumb src={null} emoji="🎨" sizes="40px">
        <span data-testid="overlay">accent</span>
      </MediaThumb>,
    );
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });

  it('container aria-hidden=true', () => {
    const { container } = render(
      <MediaThumb src={null} emoji="🎨" sizes="40px" />,
    );
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
