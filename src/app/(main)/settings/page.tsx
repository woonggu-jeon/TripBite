import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { SettingsClient } from './_components/SettingsClient';

/**
 * 설정 페이지 (/settings)
 *
 * 사이트맵 v2: 헤더 드롭다운에서 별도 페이지로 승격.
 *
 * 4 섹션 (스크롤 리스트):
 *   1) 알림 카테고리별 설정
 *      - 푸시 ON/OFF (브라우저 권한 + 서버 settings)
 *      - 인앱 ON/OFF
 *      - 편지 도착 / 좋아요 / 이벤트 (개별 토글)
 *
 *   2) 계정 / 권한
 *      - 닉네임 변경 (인라인 또는 모달)
 *      - 위치 권한 상태 + 변경 안내
 *
 *   3) 정책
 *      - 이용약관 (외부 또는 내부 정적 페이지)
 *      - 개인정보처리방침
 *      - 오픈소스 라이선스 (선택)
 *
 *   4) 계정 액션
 *      - 언어 변경 (LanguageSwitcher 그대로 사용)
 *      - 로그아웃
 *      - 회원 탈퇴 (확인 모달 필수)
 *      - 문의하기 (메일/외부 폼)
 *
 * 페이지 vs 드롭다운으로 바꾼 이유:
 *   - 모바일에서 토글 많아서 스크롤 영역 필요
 *   - URL 가질 수 있어 딥링크 가능 (예: /settings 직접 진입)
 *   - 접근성 (포커스 트랩 관리 안 해도 됨)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings');
  return { title: t('title') };
}

export default async function SettingsPage() {
  const t = await getTranslations('settings');
  return (
    <>
      <SubHeader title={t('title')} />
      <SettingsClient />
    </>
  );
}
