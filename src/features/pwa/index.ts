/**
 * PWA feature — Public API
 *
 * 사용:
 *   import { PwaUpdateBanner, OfflineBanner, InstallPromptBanner } from '@/features/pwa';
 *
 * 모든 배너를 Providers 안에 마운트:
 *   <PwaUpdateBanner />     새 SW 감지 시
 *   <OfflineBanner />       offline 시
 *   <InstallPromptBanner /> 설치 가능 + 사용자 미거부 시
 */
export { PwaUpdateBanner } from './components/PwaUpdateBanner';
export { OfflineBanner } from './components/OfflineBanner';
export { InstallPromptBanner } from './components/InstallPromptBanner';
export { MockModeBanner } from './components/MockModeBanner';
export { useServiceWorkerUpdate } from './hooks/use-service-worker-update';
export { useInstallPrompt } from './hooks/use-install-prompt';
export { useOnline } from './hooks/use-online';
