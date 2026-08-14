import { safeInternalPath } from './safe-redirect';

describe('safeInternalPath — open-redirect 방어', () => {
  it('내부 경로는 그대로 통과 (search/hash 보존)', () => {
    expect(safeInternalPath('/mypage')).toBe('/mypage');
    expect(safeInternalPath('/letter?tab=sent')).toBe('/letter?tab=sent');
    expect(safeInternalPath('/quiz#result')).toBe('/quiz#result');
  });

  it('빈/누락 입력은 /', () => {
    expect(safeInternalPath(null)).toBe('/');
    expect(safeInternalPath(undefined)).toBe('/');
    expect(safeInternalPath('')).toBe('/');
  });

  it('프로토콜 상대 URL 차단 (//evil.com)', () => {
    expect(safeInternalPath('//evil.com')).toBe('/');
    expect(safeInternalPath('//evil.com/path')).toBe('/');
  });

  it('백슬래시 우회 차단 (/\\evil.com → //evil.com 정규화)', () => {
    expect(safeInternalPath('/\\evil.com')).toBe('/');
    expect(safeInternalPath('/\\/evil.com')).toBe('/');
  });

  it('탭/개행 우회 차단 (제어문자 제거 후 //evil.com)', () => {
    expect(safeInternalPath('/\t/evil.com')).toBe('/');
    expect(safeInternalPath('/\n/evil.com')).toBe('/');
  });

  it('절대 외부 URL / 스킴 차단', () => {
    expect(safeInternalPath('https://evil.com')).toBe('/');
    expect(safeInternalPath('http://evil.com/x')).toBe('/');
    expect(safeInternalPath('javascript:alert(1)')).toBe('/');
  });

  it('실 origin 을 넘겨도 외부는 차단, 내부는 통과', () => {
    const origin = 'https://tripbite.app';
    expect(safeInternalPath('/mypage', origin)).toBe('/mypage');
    expect(safeInternalPath('//evil.com', origin)).toBe('/');
    expect(safeInternalPath('/\\evil.com', origin)).toBe('/');
  });
});
