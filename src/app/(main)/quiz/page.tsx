import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/layout/SubHeader';
import { QuizFlow } from './_components/QuizFlow';

/**
 * 여행 유형 테스트 페이지 (/quiz)
 *
 * 사이트맵 v2: 랭킹의 섹션이 아닌 별도 페이지로 승격.
 *   - 랭킹 페이지 또는 홈에서 진입
 *   - URL 공유 가능 (마케팅에 유리)
 *
 * 구성:
 *   - 4~5문항 질문 (Carousel 또는 step 형태)
 *   - 결과 화면:
 *     · 유형 코드/타이틀
 *     · 추천 여행지 3곳 (서버가 유형 기반 매칭)
 *     · 공유 카드 생성 (html2canvas 또는 OG 이미지)
 *
 * 데이터:
 *   - GET  /quiz/questions
 *   - POST /quiz/submit → { type, recommendations[3] }
 *   - GET  /quiz/me  (재진입 시 이전 결과)
 *
 * 성능:
 *   - 질문 데이터는 CACHE.static (거의 안 바뀜)
 *   - Carousel은 동적 import (이미 features/carousel에서 처리)
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('quiz');
  return { title: t('title') };
}

export default async function QuizPage() {
  const t = await getTranslations('quiz');
  return (
    <>
      <SubHeader title={t('title')} />
      <QuizFlow />
    </>
  );
}
