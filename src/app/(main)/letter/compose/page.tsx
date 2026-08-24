import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SubHeader } from '@/components/layout/SubHeader';
import { LetterComposeForm } from '@/features/letter/components/LetterComposeForm';

/**
 * 편지 작성 페이지 (/letter/compose)
 *
 * 사양:
 *   - 5글자 이하 입력 (zod 검증)
 *   - 보낸 위치 자동 채우기 (useResolveLocation)
 *     · 첫 진입 시 <LocationPermissionPrompt /> 노출 → 허용 후 GPS
 *     · 거부 시 IP 기반 fallback (백엔드 /location/ip)
 *   - 보내기 → POST /letters (body + 좌표 또는 regionCode)
 *
 * 위치 권한 UX:
 *   - prompt 상태: 사전 안내 후 사용자가 "허용" 버튼 누르면 실제 권한 요청
 *   - granted: 자동으로 위치 갱신
 *   - denied: IP fallback + 안내 메시지
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('letter.compose');
  return { title: t('title') };
}

export default async function LetterComposePage() {
  const t = await getTranslations('letter.compose');
  return (
    <>
      <SubHeader title={t('title')} />
      <LetterComposeForm />
    </>
  );
}
