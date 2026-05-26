/**
 * vitest용 — node 환경에서 fetch 가로채기
 *
 * msw 설치 후 활성화:
 *   import { setupServer } from 'msw/node';
 *   import { handlers } from './handlers';
 *   export const server = setupServer(...handlers);
 *
 * vitest.setup.ts 에서:
 *   beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */
export const server = {
  // msw 설치 전 placeholder — 호환을 위해 최소 인터페이스 유지
  listen() {},
  close() {},
  resetHandlers() {},
};
