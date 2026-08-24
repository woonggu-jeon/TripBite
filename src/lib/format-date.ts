/**
 * 한국식 점 구분 날짜 포맷 — `2026.08.13` (옵션으로 `2026.08.13 14:05`).
 *
 * next-intl `useFormat().dateTime`(locale dateStyle)과 별개로, 편지 화면이 시안상
 * 고정 점(.) 구분 형식을 쓴다(로케일 무관). 편지 상세/보낸함이 공유하던 동일
 * 구현을 이 헬퍼로 통합.
 */
export function formatDotDate(iso: string, opts?: { time?: boolean }): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const date = `${y}.${m}.${day}`;
  if (!opts?.time) return date;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}
