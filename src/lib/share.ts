/**
 * URL 공유 유틸 — Web Share API + clipboard fallback.
 *
 * 두 경로:
 *   1) navigator.share 지원 (iOS Safari, Android Chrome, 최신 Edge 등)
 *      → OS share sheet 노출. 카카오톡/메시지/메일/사진 저장 등 선택.
 *   2) 미지원 또는 share 실패 (Desktop Chrome 일부, Firefox 등)
 *      → clipboard.writeText fallback. 호출부가 toast 표시.
 *
 * 사용자 취소(AbortError)는 'cancelled' 로 별도 분기 — 호출부가 silent 처리.
 *
 * 책임 분리:
 *   - 본 함수: share 시도 + clipboard fallback + 결과 반환만.
 *   - 호출부 (React 컴포넌트): 결과 받아 i18n toast 표시.
 *   - lib 안에서 useTranslations 호출 불가 (hook) — 메시지는 호출부에서.
 *
 * 번들 영향: 0 KB (browser API 만 사용, 외부 라이브러리 X).
 */

export type ShareInput = {
  /** 절대 URL 또는 site-relative path ("/destination/abc") — 자동으로 절대화. */
  url: string;
  title?: string;
  text?: string;
};

export type ShareResult =
  /** Web Share API 로 OS sheet 노출 성공 (사용자 선택 여부와 무관) */
  | 'shared'
  /** Clipboard 로 URL 복사 성공 — 호출부가 toast "복사되었어요" 표시 */
  | 'copied'
  /** 사용자가 OS sheet 에서 취소 (AbortError) — silent 처리 권장 */
  | 'cancelled'
  /** share / clipboard 모두 실패 — 호출부가 toast "공유 실패" 표시 */
  | 'failed';

function toAbsoluteUrl(urlOrPath: string): string {
  if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
  if (typeof window === 'undefined') return urlOrPath;
  try {
    return new URL(urlOrPath, window.location.origin).toString();
  } catch {
    return urlOrPath;
  }
}

export async function shareUrl(input: ShareInput): Promise<ShareResult> {
  if (typeof navigator === 'undefined') return 'failed';
  const absoluteUrl = toAbsoluteUrl(input.url);
  const payload: ShareData = { url: absoluteUrl };
  if (input.title) payload.title = input.title;
  if (input.text) payload.text = input.text;

  // 1) Web Share API
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      // 사용자 취소는 silent 처리. 그 외는 clipboard fallback.
      if ((err as DOMException | undefined)?.name === 'AbortError') {
        return 'cancelled';
      }
      // fall through
    }
  }

  // 2) Clipboard fallback
  try {
    if (
      typeof navigator.clipboard?.writeText !== 'function' ||
      !window.isSecureContext
    ) {
      return 'failed';
    }
    await navigator.clipboard.writeText(absoluteUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
