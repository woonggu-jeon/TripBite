import { defineConfig } from '@hey-api/openapi-ts';

/**
 * OpenAPI codegen 설정 — 타입 + SDK 함수 + axios 클라이언트
 *
 * 호출 전략: **request override 패턴**
 *   1) generated SDK가 자체 client 인스턴스를 받음 (@hey-api/client-axios)
 *   2) src/services/api/openapi-client.ts 에서 그 client에
 *      services/api/client.ts 의 우리 axios 인스턴스를 setConfig로 주입
 *   3) 결과: SDK 호출 → 우리 axios → interceptor(401 refresh / timing) /
 *      MSW proxy baseURL 분기 / CSP / withCredentials 모두 보존
 *
 * 사용 절차 (백엔드 준비 후):
 *   1) curl $OPENAPI_URL -o openapi.json   (또는 npm run fetch:openapi)
 *   2) npm run generate:api                 → src/generated/api/
 *   3) src/services/api/openapi-client.ts 의 setConfig 활성화
 *   4) features 의 manual api 를 generated SDK 호출로 점진 교체
 */
export default defineConfig({
  input: './openapi.json',
  output: {
    path: './src/generated/api',
    format: 'prettier',
    lint: 'eslint',
  },
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    {
      name: '@hey-api/client-axios',
      // 우리 axios 인스턴스를 주입할 거라 baseUrl/runtime 등 기본값은 빈 상태로 둠
      // (실제 설정은 src/services/api/openapi-client.ts 의 setConfig)
    },
    {
      // TanStack Query hook 자동 생성 — useFooQuery / useFooMutation.
      // features/*/hooks 가 generated hook 을 wrapping (queryKey/queryFn 동기화 자동).
      name: '@tanstack/react-query',
    },
  ],
});
