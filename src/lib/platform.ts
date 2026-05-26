'use client';

/**
 * 플랫폼 / 실행 환경 감지
 *
 * 사용처:
 *   - InstallPromptBanner: iOS Safari 는 beforeinstallprompt 미지원 → 별도 안내
 *   - 햅틱: iOS Safari 는 vibrate 미지원 → no-op (이미 lib/haptic 처리)
 *   - 토너먼트 store: iOS PWA 는 백그라운드 시 빠른 메모리 폐기 → sessionStorage 백업
 *   - 푸시: iOS 16.4+ + standalone 일 때만 활성화
 *
 * SSR 안전 — typeof window 가드 후 호출.
 */

export type Platform = 'ios' | 'android' | 'web';

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  // iPadOS 13+ 는 navigator.platform 이 'MacIntel' 로 보고됨 — touch points 로 보완
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * PWA 로 설치되어 실행 중인지 여부
 *
 * - 표준: matchMedia('(display-mode: standalone)')
 * - iOS: navigator.standalone (legacy)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mediaStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
  return Boolean(mediaStandalone || iosStandalone);
}

export function getPlatform(): Platform {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'web';
}

/**
 * iOS Safari 버전 — Web Push 같은 신기능 가용성 확인용 (16.4+ 필요)
 * 실패하거나 추출 못하면 null.
 */
export function iosSafariVersion(): number | null {
  if (!isIOS()) return null;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return null;
  return parseFloat(`${match[1]}.${match[2]}`);
}
