import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import security from 'eslint-plugin-security';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: ['src/generated/**', '.next/**', 'node_modules/**', 'public/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  security.configs.recommended,
  {
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
    },
  },
];

export default eslintConfig;
