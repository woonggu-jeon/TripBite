/**
 * dev 환경용 — service worker 로 fetch 가로채기
 *
 * msw 설치 후 활성화:
 *   import { setupWorker } from 'msw/browser';
 *   import { handlers } from './handlers';
 *   export const worker = setupWorker(...handlers);
 *
 * 진입 (예: providers.tsx 또는 별도 init 모듈):
 *   if (process.env.NEXT_PUBLIC_USE_MSW === 'true') {
 *     const { worker } = await import('@/mocks/browser');
 *     await worker.start({ onUnhandledRequest: 'bypass' });
 *   }
 *
 * 사전 작업:
 *   npx msw init public/ --save     # public/mockServiceWorker.js 생성
 */
export {};
