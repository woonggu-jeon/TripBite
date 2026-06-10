// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import security from 'eslint-plugin-security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [{
  ignores: [
    'src/api/generated/**',
    'src/generated/**',
    '.next/**',
    'node_modules/**',
    'public/**',
  ],
}, ...compat.extends(
  'next/core-web-vitals',
  'next/typescript',
  'plugin:jsx-a11y/recommended',
), security.configs.recommended, {
  rules: {
    // detect-object-injection은 obj[key] 전부 경고라 노이즈 과다 → off
    // (입력 검증은 zod schema + lib/validation에서 담당)
    'security/detect-object-injection': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    // 렌더링 직결 — 잘못된 의존성 배열은 stale closure/무한루프 유발
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',
    // 안전/일관성
    eqeqeq: ['error', 'smart'],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'object-shorthand': 'warn',
    // a11y — 핵심 위반은 error(기본), 트레이드오프 큰 룰은 warn으로:
    //  · click-events-have-key-events / no-static-element-interactions:
    //    ConfirmDialog backdrop은 이미 Esc + focus trap 구비, dismiss는 부가
    //  · no-autofocus: 단일 입력 페이지(NicknameStep)에서 의도적 사용
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    'jsx-a11y/no-autofocus': 'warn',
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
