import { getRequestConfig } from 'next-intl/server';
import { readLocaleFromCookie } from './locale';

/**
 * next-intl 핵심 설정
 *
 * 이 파일은 next.config.js 의 createNextIntlPlugin 이 가리키며,
 * 모든 요청마다 호출되어:
 *   1) 현재 locale 결정 (쿠키 기반)
 *   2) 해당 locale의 messages JSON 로드
 *
 * 결과는:
 *   - Server: getTranslations(), getLocale(), getFormatter() 등에서 사용
 *   - Client: <NextIntlClientProvider /> 를 통해 자동 전달
 *
 * dynamic import 를 사용해 사용 안 하는 locale 의 JSON은 번들에 포함하지 않음.
 */
export default getRequestConfig(async () => {
  const locale = await readLocaleFromCookie();

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
