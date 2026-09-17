import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PolicyArticle } from '@/components/layout/PolicyArticle';
import { SubHeader } from '@/components/layout/SubHeader';
import styles from './page.module.scss';

/**
 * 오픈소스 라이선스 (/policy/licenses)
 *
 * 사용 중인 OSS 라이브러리 라이선스 표시.
 *
 * 자동 생성 방법:
 *   npx license-checker --production --json > public/licenses.json
 *   이 페이지에서 fetch + 정렬해서 표시
 *
 * 또는:
 *   build 시점에 generate 후 정적 파일로 제공
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings.policy');
  return { title: t('licenses') };
}

export default async function LicensesPage() {
  const t = await getTranslations('settings.policy');
  return (
    <>
      <SubHeader title={t('licenses')} />
      <PolicyArticle>
        <p className={styles.intro}>
          본 서비스는 다음 오픈소스 라이브러리를 사용합니다.
        </p>
        {/* TODO: 빌드 시점 license-checker 결과를 여기에 출력
            또는 public/licenses.json 을 fetch */}
        <ul className={styles.list}>
          <li>Next.js (MIT)</li>
          <li>React (MIT)</li>
          <li>TanStack Query (MIT)</li>
          <li>Zustand (MIT)</li>
          <li>next-intl (MIT)</li>
          <li>Recharts (MIT)</li>
          <li>Embla Carousel (MIT)</li>
          <li>Zod (MIT)</li>
          <li>...</li>
        </ul>

        {/* 관광 데이터 출처 — 공모전 FAQ 지정 표기 (텍스트만, 공사 CI/BI 로고 사용 금지) */}
        <h2 className={styles.subTitle}>데이터 출처</h2>
        <p className={styles.source}>
          여행지·축제·체험 정보와 사진은 한국관광공사 관광정보 OpenAPI(국문
          관광정보 서비스)에서 제공받습니다.
          <br />
          출처: ⓒ한국관광공사
        </p>
      </PolicyArticle>
    </>
  );
}
