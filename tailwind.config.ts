import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  // src 전체 스캔 — hooks/lib 등에서 className을 써도 prod purge 누락 방지
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // globals.scss CSS 변수 토큰을 Tailwind 클래스로 노출 (단일 출처).
      // 예: bg-primary, text-muted, rounded-md, max-w-content, font-sans
      colors: {
        bg: 'var(--color-bg)',
        fg: 'var(--color-fg)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-fg': 'var(--color-primary-fg)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      maxWidth: {
        content: 'var(--content-max)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
      },
    },
  },
  plugins: [],
};

export default config;
