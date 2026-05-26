/**
 * next-intl 메시지 키 타입 안전성
 *
 * 이 declare로 인해:
 *   - useTranslations() / getTranslations() 가 반환하는 t() 가
 *   - t('nav.home') 처럼 정확한 키만 허용
 *   - 오타나 존재하지 않는 키 사용 시 컴파일 에러
 *   - VSCode 자동완성 동작
 *
 * 기준 언어는 ko.json (모든 키의 source of truth).
 * 새 언어 추가 시엔 ko.json 의 구조를 그대로 따라야 함.
 */
import type messages from '@/i18n/messages/ko.json';

type Messages = typeof messages;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
