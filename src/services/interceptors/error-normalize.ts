import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

/**
 * BE 에러 응답 형태 표준화.
 *
 * BE 합의 (Spring Boot Swagger):
 *   { code: string, message: string, details?: unknown }
 *
 * 본 interceptor 는 모든 axios 응답 에러에 normalized 속성을 부여:
 *   - err.normalized.code     — 에러 코드 (예: 'AUTH_INVALID_CREDENTIAL')
 *   - err.normalized.message  — 사용자 노출용 메시지
 *
 * 호출처는 isAxiosError(err) 후 err.normalized 만 보면 됨 — 응답 body 형태 변경에
 * 강인하게.
 *
 * BE 가 아직 합의 안 됐을 때:
 *   - data.message 우선, 없으면 statusText
 *   - code 는 status 별 기본값 (401 → AUTH, 403 → FORBIDDEN, 404 → NOT_FOUND ...)
 */

export type NormalizedError = {
  code: string;
  message: string;
};

declare module 'axios' {
  interface AxiosError {
    normalized?: NormalizedError;
  }
}

const STATUS_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'AUTH',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION',
  429: 'RATE_LIMIT',
  500: 'SERVER',
  502: 'BAD_GATEWAY',
  503: 'UNAVAILABLE',
};

const GENERIC_MESSAGE: Record<string, string> = {
  AUTH: '로그인이 필요해요.',
  FORBIDDEN: '접근 권한이 없어요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없어요.',
  CONFLICT: '이미 처리된 요청이에요.',
  VALIDATION: '입력값을 확인해주세요.',
  RATE_LIMIT: '잠시 후 다시 시도해주세요.',
  SERVER: '서버에서 일시적인 문제가 발생했어요.',
  BAD_GATEWAY: '서버에서 일시적인 문제가 발생했어요.',
  UNAVAILABLE: '서비스를 잠시 사용할 수 없어요.',
  BAD_REQUEST: '요청을 처리하지 못했어요.',
  NETWORK: '네트워크 연결을 확인해주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했어요.',
};

function pickMessage(
  data: unknown,
  status: number | undefined,
  code: string,
  statusText?: string,
): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim())
      return obj.message;
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error;
  }
  if (statusText && status && status >= 400)
    return GENERIC_MESSAGE[code] ?? statusText;
  return GENERIC_MESSAGE[code] ?? GENERIC_MESSAGE.UNKNOWN!;
}

export function attachErrorNormalizeInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const status = error.response?.status;
      const data = error.response?.data;
      const statusText = error.response?.statusText;
      let code = 'UNKNOWN';
      if (!error.response) code = 'NETWORK';
      else if (status && STATUS_CODE[status]) code = STATUS_CODE[status]!;
      // BE 가 보낸 code 가 더 구체적이면 우선
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (typeof obj.code === 'string' && obj.code.trim()) code = obj.code;
      }
      error.normalized = {
        code,
        message: pickMessage(data, status, code, statusText),
      };
      return Promise.reject(error);
    },
  );
}
