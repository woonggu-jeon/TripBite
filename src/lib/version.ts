/**
 * 앱 버전 정보
 *
 * NEXT_PUBLIC_APP_VERSION 은 빌드 시점에 주입:
 *   - GitHub Actions: ${{ github.sha }} short
 *   - Vercel: $VERCEL_GIT_COMMIT_SHA
 *   - 로컬: package.json 의 version
 *
 * 표시 위치:
 *   - /settings 페이지 하단
 *   - /api/health 응답
 *   - analytics release 태그
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

export function shortVersion(): string {
  return APP_VERSION.slice(0, 8);
}
