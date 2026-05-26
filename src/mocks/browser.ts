/**
 * Dev 환경에서 service worker로 fetch 가로채기
 *
 * providers.tsx 에서 동적 import:
 *   if (process.env.NEXT_PUBLIC_USE_MSW === 'true') {
 *     const { worker } = await import('@/mocks/browser');
 *     await worker.start({ onUnhandledRequest: 'bypass' });
 *   }
 *
 * 사전 작업 (이미 완료):
 *   npx msw init public/ --save     # public/mockServiceWorker.js 생성
 *
 * 주의:
 *   service worker 는 same-origin scope 만 가로챔.
 *   cross-origin API 는 axios baseURL 을 same-origin 으로 두고 Next rewrites 로 우회 필요.
 */
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
