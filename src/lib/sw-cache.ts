/**
 * Service Worker 캐시 헬퍼
 *
 * 사용 목적:
 *   1) 로그아웃 시 캐시 비우기 — 다음 사용자가 이전 사용자 데이터 보지 않도록
 *   2) "캐시 비우기" 설정 UX 제공
 *   3) 디버깅
 *
 * 주의:
 *   - SW가 비활성화된 환경 (dev mode 등) 에선 silently no-op
 *   - 실패는 throw하지 않음 (로그아웃이 캐시 때문에 실패하면 안 됨)
 */
import { createLogger } from '@/lib/logger';

const log = createLogger('sw-cache');

export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('caches' in window)) return;

  try {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  } catch (err) {
    log.warn({ err }, 'clearAllCaches failed');
  }
}

/**
 * Service Worker 자체 해제 (강제 갱신, 디버깅용)
 * 일반적인 로그아웃에선 호출하지 않음 — clearAllCaches 만으로 충분.
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  } catch (err) {
    log.warn({ err }, 'unregisterServiceWorker failed');
  }
}
