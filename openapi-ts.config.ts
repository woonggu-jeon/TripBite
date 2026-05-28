import { defineConfig } from '@hey-api/openapi-ts';

/**
 * OpenAPI codegen 설정 — 타입만 생성 (서비스 클래스/클라이언트 X)
 *
 * 호출 전략:
 *   기존 manual API(features 디렉토리의 api 모듈)와 services/api/client.ts axios
 *   인스턴스(interceptor·MSW proxy·CSP 등)를 유지하면서, 타입만 generated에서 import.
 *   → codegen된 axios 클라이언트가 우리 interceptor를 우회하지 않게 안전.
 *
 * 사용 절차 (백엔드 준비 후):
 *   1) `openapi.json` 확보:
 *        curl $OPENAPI_URL -o openapi.json
 *      또는 백엔드 팀에서 파일로 받기.
 *   2) 생성:
 *        npm run generate:api
 *   3) 적용:
 *        features/<feature>/types/index.ts 의 fallback 타입을 generated에서 re-export.
 *        예) export type { LoginRequest } from '@/generated/api';
 *
 * 출력 디렉토리는 .gitignore 안 함 (커밋 정책 — CI에서 매번 생성하지 않아도 되도록).
 */
export default defineConfig({
  input: './openapi.json',
  output: {
    path: './src/generated/api',
    format: 'prettier',
    lint: 'eslint',
  },
  plugins: [
    // 타입만 생성 — services/sdk 비활성
    '@hey-api/typescript',
  ],
});
