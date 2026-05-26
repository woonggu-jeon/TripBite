import { NextResponse } from 'next/server';
import { APP_VERSION } from '@/lib/version';

/**
 * 헬스체크 (/api/health)
 *
 * 용도:
 *   - Vercel uptime monitor
 *   - 외부 모니터링 도구 ping
 *   - 사용자 버그 리포트 시 버전 확인
 *
 * force-dynamic: 캐시 X (항상 fresh 응답)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // 빠른 응답 (선택)

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
}
