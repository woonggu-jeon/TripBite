'use client';

import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/feedback/EmptyState';

/**
 * 준비중 안내 — Spring BE 미지원(엔드포인트 없음)이라 아직 제공하지 못하는 기능의
 * 진입점에 표시. UI 진입점(라우트/버튼)은 남기되 동작 대신 "곧 제공" 안내.
 * BE 가 엔드포인트를 추가하면 이 자리에 실제 폼/동작을 되살린다.
 */
export function ComingSoon({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations('common.comingSoon');
  return (
    <EmptyState
      icon={<Clock size={28} aria-hidden />}
      title={title ?? t('title')}
      description={description ?? t('description')}
      variant="card"
    />
  );
}
