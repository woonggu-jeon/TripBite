import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * next-intl 핵심 설정 — URL prefix 기반 locale.
 *
 * 모든 요청마다 호출되어:
 *   1) URL pathname 에서 locale 추출 (`/en/...` → en, prefix 없음 → defaultLocale)
 *   2) 해당 locale 의 messages JSON 로드
 *
 * URL prefix 기반이라 `cookies()` 호출 없음 → static generation / ISR 와 호환.
 * (이전 cookie 기반 → DYNAMIC_SERVER_USAGE 회귀 해소.)
 *
 * 결과:
 *   - Server: getTranslations(), getLocale(), getFormatter() 등
 *   - Client: <NextIntlClientProvider /> 를 통해 자동 전달
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,

    // 공통 포맷 (필요 시 확장)
    formats: {
      dateTime: {
        short: {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        },
        time: {
          hour: '2-digit',
          minute: '2-digit',
        },
      },
      number: {
        percent: {
          style: 'percent',
          maximumFractionDigits: 0,
        },
      },
    },

    // 기본 시간대 (서버/클라이언트 hydration 불일치 방지)
    // 사용자별 시간대를 쓰려면 헤더/쿠키에서 읽어 동적으로 지정 가능
    timeZone: 'Asia/Seoul',
  };
});
