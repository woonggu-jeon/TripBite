import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import {
  PolicyArticle,
  PolicySection,
  PolicyFooter,
} from '@/components/layout/PolicyArticle';
import styles from './page.module.scss';

/**
 * 개인정보처리방침 (/policy/privacy)
 *
 * 한국 개인정보보호법(PIPA) + 위치정보법 + GDPR 고려.
 *
 * 반드시 포함:
 *   1) 수집 항목 — 닉네임/이메일/위치/디바이스 정보 등
 *   2) 수집 목적 — 서비스 제공 / 토너먼트 매칭 / 편지 전송 등
 *   3) 보유 기간 — 회원 탈퇴 시 즉시 또는 30일 유예
 *   4) 제3자 제공 — TourAPI, 지도, 푸시 등
 *   5) 처리 위탁 — Vercel, CDN 등
 *   6) 이용자 권리 — 열람/정정/삭제/처리정지
 *   7) 개인정보보호책임자 연락처
 *   8) 만 14세 미만 보호자 동의 절차
 *
 * 본문 확정은 법무/개인정보보호 담당자 검토 필수.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.policy');
  return { title: t('privacy') };
}

export default async function PrivacyPage() {
  const t = await getTranslations('settings.policy');
  return (
    <>
      <SubHeader title={t('privacy')} />
      <PolicyArticle>
        {/* TODO: 실제 처리방침 본문 (법무 검토). 아래는 자리잡이. */}
        <PolicySection heading="1. 수집하는 개인정보 항목">
          <ul className={styles.list}>
            <li>필수: 닉네임, 이메일, 가입일시, IP 주소</li>
            <li>선택: 위치 정보(좌표), 푸시 토큰</li>
            <li>자동수집: 디바이스 정보, 접속 로그</li>
          </ul>
        </PolicySection>
        <PolicySection heading="2. 처리 목적">
          서비스 제공, 토너먼트 매칭, 다섯글자 편지 전송/표시, 알림 전송.
        </PolicySection>
        <PolicySection heading="3. 보유 및 이용 기간">
          회원 탈퇴 시 즉시 파기. 단, 관련 법령에 따라 보존 의무가 있는 정보는
          해당 기간 동안 보관.
        </PolicySection>
        <PolicySection heading="4. 제3자 제공">
          원칙적으로 제공하지 않습니다. 위치 정보는 한국관광공사 TourAPI 조회에
          쿼리 파라미터로만 사용되며 저장되지 않습니다.
        </PolicySection>
        <PolicySection heading="5. 처리 위탁">
          Vercel(호스팅 · 익명 web vitals/페이지뷰), 푸시 서비스 등에 일부
          정보가 처리 위탁됩니다.
        </PolicySection>
        <PolicySection heading="6. 이용자 권리">
          언제든지 열람·정정·삭제·처리정지를 요구할 수 있습니다. 설정 페이지에서
          닉네임 변경/회원 탈퇴가 가능합니다.
        </PolicySection>
        <PolicySection heading="7. 개인정보보호 책임자">
          이메일: privacy@example.com
        </PolicySection>
        <PolicySection heading="8. 만 14세 미만 아동">
          본 서비스는 만 14세 이상부터 가입할 수 있습니다.
        </PolicySection>
        <PolicyFooter>시행일자: 2024-01-01 · 버전 1.0</PolicyFooter>
      </PolicyArticle>
    </>
  );
}
