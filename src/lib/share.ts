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
  /** Desktop Chrome/Edge: 이미지 blob 자체 clipboard 복사 (Ctrl+V 로 채팅 첨부) */
  | 'copied-image'
  /** Web Share API 미지원 환경에서 이미지 파일 다운로드로 fallback */
  | 'downloaded'
  /** Desktop 미지원 환경에서 URL clipboard copy + 이미지 다운로드 동시 (둘 다 성공) */
  | 'copied-and-downloaded'
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

/**
 * 이미지 파일 공유 — 결과 이미지 카드 (`/api/og/...`) 를 OS share sheet 또는
 * Desktop 환경별 fallback 으로.
 *
 * 흐름 (mobile / file share 지원):
 *   1) imageUrl fetch → Blob → File
 *   2) navigator.canShare({ files: [...] }) 검증 (iOS Safari 16+, Android Chrome,
 *      Mac Safari 13+)
 *      → navigator.share({ files }) — OS sheet → 카톡 등 채팅 첨부
 *
 * 흐름 (Desktop file share 미지원 — Chrome/Edge/Firefox 일부):
 *   - imageUrl 절대 URL 을 clipboard 에 copy +
 *   - 이미지 PNG 도 함께 다운로드 (사용자가 둘 다 받음)
 *   - 'copied-and-downloaded' 반환 → 호출부가 toast 둘 다 안내
 *   - 받는 쪽이 URL 클릭하면 OG 카드 PNG 만 표시 (deep-link backend 불필요).
 *     카톡/슬랙 등은 URL 미리보기 image preview 자동 노출.
 *
 * deep-link 불필요 — 받는 쪽은 이미지 파일 또는 OG image URL 만 받음.
 * 사용자 결과 데이터는 imageUrl 의 query 로 인코딩 (server route 가 그대로 렌더).
 */
export type ShareWithImageInput = {
  imageUrl: string;
  filename?: string;
  title?: string;
  text?: string;
};

export async function shareWithImage(
  input: ShareWithImageInput,
): Promise<ShareResult> {
  if (typeof navigator === 'undefined') return 'failed';
  const filename = input.filename ?? 'tripbite-share.png';

  // 모바일 vs 데스크탑 분기 — 데스크탑 Chrome 도 `navigator.canShare({files})` 가
  // true 반환할 수 있어 그대로 share() 호출하면 OS sheet 없이 실패 → 그 시점에
  // user activation 이 소실되어 후속 clipboard 도 NotAllowedError. 따라서
  // 모바일 식별을 먼저 한 뒤에만 file share 경로로.
  const ua = navigator.userAgent ?? '';
  const isLikelyMobile =
    (navigator as Navigator & { userAgentData?: { mobile?: boolean } })
      .userAgentData?.mobile === true || /Mobi|Android|iPhone|iPad/i.test(ua);

  const probeFile = new File([new Blob([])], 'probe.png', {
    type: 'image/png',
  });
  const supportsFileShare =
    isLikelyMobile &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [probeFile] });

  // 1) Web Share API (files) — 모바일 (iOS Safari 16+ / Android Chrome / Mac Safari 13+).
  //    모바일은 share API 가 fetch 후 호출돼도 user activation 관대.
  if (supportsFileShare) {
    try {
      const res = await fetch(input.imageUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const file = new File([blob], filename, {
        type: blob.type || 'image/png',
      });
      const payload: ShareData = { files: [file] };
      if (input.title) payload.title = input.title;
      if (input.text) payload.text = input.text;
      await navigator.share(payload);
      return 'shared';
    } catch (err) {
      if ((err as DOMException | undefined)?.name === 'AbortError') {
        return 'cancelled';
      }
      // fetch / share 실패 → desktop fallback 으로
    }
  }

  // 2) Desktop Chrome/Edge — clipboard 에 image blob 자체 복사 (Ctrl+V 로 채팅 첨부).
  //    ⚠ user gesture 유지: ClipboardItem 에 Blob 대신 Promise<Blob> 전달.
  //    `await fetch` 후 clipboard.write 호출하면 user activation 소실되어
  //    NotAllowedError. Promise 를 직접 전달하면 write 가 user gesture 안에서
  //    동기 호출되고, Promise 가 resolve 될 때까지 브라우저가 대기.
  if (
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function' &&
    window.isSecureContext
  ) {
    try {
      const blobPromise = fetch(input.imageUrl).then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.blob();
      });
      // ClipboardItem 의 MIME 키는 'image/png' 고정 (서버가 PNG 반환 보장).
      const item = new ClipboardItem({ 'image/png': blobPromise });
      await navigator.clipboard.write([item]);
      return 'copied-image';
    } catch {
      // MIME 미허용 / Firefox / fetch 실패 등 → 다운로드 fallback
    }
  }

  // 3) Desktop 폴백 — OG image URL clipboard copy + 이미지 다운로드 동시.
  //    여기까지 왔으면 ClipboardItem 도 안 되는 환경 (Firefox 등). fetch 결과
  //    Blob 으로 다운로드 + URL 클립보드 복사.
  let blob: Blob;
  try {
    const res = await fetch(input.imageUrl);
    if (!res.ok) return 'failed';
    blob = await res.blob();
  } catch {
    return 'failed';
  }

  const absoluteUrl = toAbsoluteUrl(input.imageUrl);
  let copied = false;
  try {
    if (
      typeof navigator.clipboard?.writeText === 'function' &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(absoluteUrl);
      copied = true;
    }
  } catch {
    // clipboard 실패는 silent — 다운로드만으로 fallback 충분
  }

  let downloaded = false;
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    downloaded = true;
  } catch {
    // 다운로드 실패
  }

  if (copied && downloaded) return 'copied-and-downloaded';
  if (downloaded) return 'downloaded';
  if (copied) return 'copied';
  return 'failed';
}
