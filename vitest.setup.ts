import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/mocks/server';

/**
 * 테스트 전역 setup
 *
 * - jest-dom 매처: toBeInTheDocument() 등
 * - MSW server: node 환경에서 fetch 가로채기 (dev/e2e와 동일 handlers 공유)
 *   onUnhandledRequest: 'error' → 핸들러 없는 요청은 테스트 실패로 노출
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
