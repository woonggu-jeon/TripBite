import {
  normalizeImageField,
  normalizeImagesField,
  secureImageUrl,
} from './secure-image-url';

describe('secureImageUrl', () => {
  it('tong.visitkorea http → https 변환', () => {
    expect(secureImageUrl('http://tong.visitkorea.or.kr/cms/x.jpg')).toBe(
      'https://tong.visitkorea.or.kr/cms/x.jpg',
    );
  });

  it('이미 https → 그대로', () => {
    expect(secureImageUrl('https://tong.visitkorea.or.kr/x.jpg')).toBe(
      'https://tong.visitkorea.or.kr/x.jpg',
    );
  });

  it('allowlist 외 host 의 http → 그대로 (의도적 처리)', () => {
    expect(secureImageUrl('http://other.example.com/x.jpg')).toBe(
      'http://other.example.com/x.jpg',
    );
  });

  it('null/undefined/빈 문자열 → undefined', () => {
    expect(secureImageUrl(undefined)).toBeUndefined();
    expect(secureImageUrl(null)).toBeUndefined();
    expect(secureImageUrl('')).toBeUndefined();
  });

  it('invalid URL → 원본 그대로', () => {
    expect(secureImageUrl('not-a-url')).toBe('not-a-url');
  });
});

describe('normalizeImageField', () => {
  it('imageUrl 정규화 + 다른 필드 보존', () => {
    const input = {
      id: 'x',
      title: 'foo',
      imageUrl: 'http://tong.visitkorea.or.kr/x.jpg',
    };
    const result = normalizeImageField(input);
    expect(result.imageUrl).toBe('https://tong.visitkorea.or.kr/x.jpg');
    expect(result.id).toBe('x');
    expect(result.title).toBe('foo');
  });

  it('imageUrl 없으면 동일 객체 reference 반환', () => {
    const input: { id: string; imageUrl?: string } = { id: 'x' };
    expect(normalizeImageField(input)).toBe(input);
  });

  it('이미 https 인 경우 동일 객체 reference 반환 (불필요 spread 회피)', () => {
    const input = { id: 'x', imageUrl: 'https://tong.visitkorea.or.kr/x.jpg' };
    expect(normalizeImageField(input)).toBe(input);
  });
});

describe('normalizeImagesField', () => {
  it('images[] 각 http 항목을 https 로 변환', () => {
    const input = {
      images: [
        'http://tong.visitkorea.or.kr/a.jpg',
        'https://tong.visitkorea.or.kr/b.jpg',
      ],
    };
    expect(normalizeImagesField(input).images).toEqual([
      'https://tong.visitkorea.or.kr/a.jpg',
      'https://tong.visitkorea.or.kr/b.jpg',
    ]);
  });

  it('images 없거나 빈 배열 → 동일 reference', () => {
    const a = { images: undefined };
    const b = { images: [] };
    expect(normalizeImagesField(a)).toBe(a);
    expect(normalizeImagesField(b)).toBe(b);
  });

  it('전부 이미 https 면 동일 reference (불필요 spread 회피)', () => {
    const input = { images: ['https://tong.visitkorea.or.kr/a.jpg'] };
    expect(normalizeImagesField(input)).toBe(input);
  });
});
