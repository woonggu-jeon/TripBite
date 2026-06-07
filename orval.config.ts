import { defineConfig } from 'orval';

/**
 * Orval — OpenAPI → TypeScript client + react-query hooks + zod schemas + MSW handlers 자동 생성.
 *
 * BE 합류 워크플로:
 *   1) BE 팀이 Spring Boot Swagger 로 OpenAPI 3.x spec 노출 (예: http://api.tripbite.kr/v3/api-docs)
 *   2) `input.target` 을 그 URL 또는 다운받은 yaml/json 경로로 교체
 *   3) `npm run api:gen` — src/api/generated/ 에 client + hooks + schemas + msw 자동 생성
 *   4) 기존 수동 작업 단계적 제거:
 *      · src/features/{feature}/api/*.ts — 생성된 api 함수 호출로 점진 교체
 *      · src/features/{feature}/schemas/*.ts — generated zod 로 교체 (본 turn 의 10개 임시 스키마)
 *      · src/mocks/handlers.ts — generated MSW handler 로 교체 (또는 일부 데이터 채우는 retain)
 *
 * 자동 실행:
 *   - `predev` / `prebuild` 훅이 `generate:api` 자동 호출 — 개발/배포 모두 BE Swagger SoT.
 *   - Vercel 빌드 시 `OPENAPI_URL` env 가 BE 운영 swagger URL 가리켜야 (예:
 *     https://api.tripbite.kr/docs-json). 미설정 시 localhost 기본값 → 빌드 fail.
 *   - BE down 시 빌드 fail — 운영 사이트도 BE 의존이라 동시 다운이 자연.
 *
 * Output 구조 (예정):
 *   src/api/generated/
 *     ├─ client.ts      — endpoint 함수 (axios 기반)
 *     ├─ hooks.ts       — useGetMypage 등 react-query 훅
 *     ├─ schemas/       — zod 스키마 (validator)
 *     └─ msw.ts         — handlers stub (mock 응답 데이터는 별도 fixture 로 채움)
 */
export default defineConfig({
  tripbite: {
    input: {
      // BE NestJS Swagger — http://localhost:3000/docs-json 의 OpenAPI JSON.
      // 운영 swap: env 로 분기 가능 — process.env.OPENAPI_URL ?? 기본값.
      // 오프라인 fallback: api/openapi.yaml 캐시 사용 (BE 다운 시 generator 가 fail 하지 않도록).
      target: process.env.OPENAPI_URL ?? 'http://localhost:3000/docs-json',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/client.ts',
      schemas: './src/api/generated/schemas',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          // 기존 axios instance + response.data 자동 unwrap.
          // interceptor (auth refresh / error-normalize / FormData multipart) 그대로 적용.
          path: './src/services/api/orval-mutator.ts',
          name: 'orvalMutator',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          signal: true,
        },
      },
      mock: {
        generators: [{ type: 'msw' }],
        // generated mock 은 별도 파일 — 기존 handlers.ts 와 분리해 점진 마이그.
      },
    },
  },
});
