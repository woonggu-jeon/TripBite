import type { ZodSchema } from 'zod';

/**
 * 응답 스키마 검증 — `safeParse` 기반 안전 변환.
 *
 * 동작:
 *   - 성공: parsed data 반환 (zod 가 trim / strip 한 결과)
 *   - 실패: 원본 data 그대로 반환 + dev 환경에서 console.warn (mismatch 위치 + 원본)
 *     → UI crash X. BE 응답 drift 가 발견되면 콘솔에서 즉시 보임.
 *
 * 왜 strict parse() 아닌 safeParse?
 *   - mock 시점엔 type 충실, 운영 BE drift 시 throw 하면 mypage 통째 망가짐
 *   - dev/staging 에서 drift 인지하면 충분 — Sentry 가 잡지 못해도 console.warn 보임
 *
 * BE OpenAPI 도착 후엔 orval/kubb generator 가 스키마 자동 생성 → 본 helper 도 삭제 가능.
 *
 * 사용:
 *   const data = safeParseResponse(myPageSchema, res.data, 'GET /mypage');
 */
export function safeParseResponse<T>(
  schema: ZodSchema<T>,
  data: unknown,
  source: string,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[safeParseResponse] schema mismatch — ${source}\n` +
        `  issues: ${JSON.stringify(result.error.issues, null, 2)}\n` +
        `  data:   ${JSON.stringify(data).slice(0, 500)}`,
    );
  }
  // fallback — UI crash 방지. 원본 data 를 강제 캐스팅.
  return data as T;
}
