import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './json-ld';

describe('serializeJsonLd — XSS escape', () => {
  it('정상 JSON 직렬화 (한글/숫자 그대로)', () => {
    const out = serializeJsonLd({ name: '청주시 명소', count: 5 });
    expect(JSON.parse(out)).toEqual({ name: '청주시 명소', count: 5 });
  });

  it('`<` 를 \\u003c 로 escape — </script> 차단', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script');
    // JSON 으로 다시 parse 시 원래 값 복원
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });

  it('`>` 를 \\u003e 로 escape', () => {
    const out = serializeJsonLd({ tag: '<div>' });
    expect(out).toContain('\\u003e');
    expect(out).not.toMatch(/>/);
  });

  it('`&` 를 \\u0026 로 escape (HTML entity 회피)', () => {
    const out = serializeJsonLd({ url: 'a?b=1&c=2' });
    expect(out).toContain('\\u0026');
    expect(out).not.toMatch(/&/);
  });

  it('U+2028 / U+2029 (line/paragraph separator) escape', () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const text = `before${ls}after${ps}end`;
    const out = serializeJsonLd({ text });
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    expect(JSON.parse(out).text).toBe(text);
  });

  it('빈 객체 안전 (JsonLdValue 는 object 한정)', () => {
    expect(JSON.parse(serializeJsonLd({}))).toEqual({});
  });
});
