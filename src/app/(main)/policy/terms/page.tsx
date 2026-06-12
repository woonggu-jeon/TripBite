import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import {
  PolicyArticle,
  PolicySection,
  PolicyFooter,
} from '@/components/layout/PolicyArticle';

/**
 * 이용약관 (/policy/terms)
 *
 * Server Component — 정적 콘텐츠라 SSG 가능.
 * 본문은 법무 검토 후 확정하는 게 안전.
 *
 * 변경 시 사용자 동의 재취득 정책 (향후 도입 예정):
 *   - 약관 버전(termsVersion) 을 백엔드 user 레코드에 저장
 *   - 약관 업데이트 시 버전 증가 → 보호 경로 진입 시 useMe (ProfileCard)
 *     또는 별도 hook 에서 비교 후 변경된 사용자에게 재동의 UI 노출
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.policy');
  return { title: t('terms') };
}

export default async function TermsPage() {
  const t = await getTranslations('settings.policy');

  return (
    <>
      <SubHeader title={t('terms')} />
      <PolicyArticle>
        {/* TODO: 법무 검토를 거친 실제 약관 본문으로 교체.
            아래는 자리잡이 — 운영 배포 전 반드시 교체. */}
        <PolicySection heading="제1조 (목적)">
          본 약관은 서비스 이용에 관한 권리·의무·책임사항을 규정합니다.
        </PolicySection>
        <PolicySection heading="제2조 (서비스 내용)">
          여행지 토너먼트, 다섯글자 편지, 여행 유형 테스트 등.
        </PolicySection>
        <PolicySection heading="제3조 (회원 가입)">
          만 14세 이상이어야 하며, 약관 동의 후 가입할 수 있습니다.
        </PolicySection>
        <PolicySection heading="제4조 (개인정보 처리)">
          개인정보처리방침에 따릅니다.
        </PolicySection>
        <PolicySection heading="제5조 (이용 제한)">
          타인 사칭, 비속어, 스팸 행위 시 이용이 제한될 수 있습니다.
        </PolicySection>
        <PolicyFooter>시행일자: 2024-01-01 · 버전 1.0</PolicyFooter>
      </PolicyArticle>
    </>
  );
}
