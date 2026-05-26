import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // shadcn/ui init이 여기에 색상/radius 토큰을 추가합니다.
      // SCSS Modules의 var(--color-*)와 토큰을 일치시키는 것을 권장.
    },
  },
  plugins: [],
};

export default config;
