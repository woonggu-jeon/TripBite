/**
 * Generated OpenAPI SDK + 우리 axios 인스턴스 통합 (request override 패턴)
 *
 * 동작:
 *   1) @hey-api/client-axios 가 생성한 client(`@/generated/api/client.gen`)에
 *      services/api/client.ts 의 axios 인스턴스를 주입.
 *   2) 결과: 모든 SDK 호출이 우리 interceptor(401 refresh / timing) +
 *      MSW proxy baseURL 분기 + CSP + withCredentials 를 자동으로 거침.
 *
 * 활성화 (백엔드 준비 후):
 *   1) npm run fetch:openapi && npm run generate:api
 *      → src/generated/api/client.gen.ts 가 생성됨
 *   2) 아래 import + configureOpenApiClient() 호출의 주석을 해제
 *   3) src/app/providers.tsx 의 Providers 최상단(또는 모듈 top-level)에서
 *      configureOpenApiClient() 한 번 호출 — 앱 부팅 시 SDK 인스턴스 연결
 *
 * 호출 예 (활성화 후):
 *   import { postAuthLogin } from '@/generated/api';
 *   await postAuthLogin({ body: { username, password } });
 *   → 우리 axios 인스턴스 통과 → 401 refresh interceptor 자동 → 응답
 */

// 백엔드 준비 후 아래 주석 해제 ↓↓↓
// import { client as openapiClient } from '@/generated/api/client.gen';
// import { api } from '@/services/api/client';
//
// export function configureOpenApiClient(): void {
//   openapiClient.setConfig({
//     // 우리 axios 인스턴스를 SDK에 강제 주입
//     // → interceptor / MSW proxy baseURL / withCredentials 모두 우리 client 설정대로
//     axios: api,
//   });
// }

/**
 * placeholder — generated 가 아직 없는 상태에선 noop.
 * 백엔드 붙은 후 위 주석 해제하면 자동 동작.
 */
export function configureOpenApiClient(): void {
  // intentional no-op until generated SDK exists
}
