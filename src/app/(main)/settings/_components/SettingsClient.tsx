'use client';

import { useTranslations } from 'next-intl';
// 언어 섹션 일단 미노출 (사용자 요청) — LanguageSwitcher 자체는 추후 복원용으로 유지.
// import { LanguageSwitcher } from '@/features/i18n/components/LanguageSwitcher';
import { NotificationSettingsSection } from '@/features/settings/components/NotificationSettingsSection';
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection';
import { PolicySection } from '@/features/settings/components/PolicySection';
import { AccountActionsSection } from '@/features/settings/components/AccountActionsSection';
import { PageSection } from '@/components/ui';
import styles from './SettingsClient.module.scss';

/**
 * 설정 페이지 본문
 *
 * 섹션 4개를 위에서 아래로 배치.
 * 각 섹션은 features/settings 의 컴포넌트로 분리.
 *
 * 성능:
 *   - 섹션마다 자체 useQuery (필요한 경우만) → waterfall 없음
 *   - 변경은 mutation + onSuccess invalidate
 *   - 토글 즉시 반영 + optimistic update 권장
 */
export function SettingsClient() {
  const t = useTranslations('settings');

  return (
    <div className={styles.wrap}>
      <PageSection title={t('notifications.section')}>
        <NotificationSettingsSection />
      </PageSection>

      <PageSection title={t('account.section')}>
        <AccountSettingsSection />
      </PageSection>

      {/* 언어 섹션 — 미노출 (사용자 요청). 추후 복원 시 주석 해제.
      <PageSection title={t('language')}>
        <LanguageSwitcher />
      </PageSection>
      */}

      <PageSection title={t('policy.section')}>
        <PolicySection />
      </PageSection>

      <PageSection title={t('account.section')}>
        <AccountActionsSection />
      </PageSection>
    </div>
  );
}
