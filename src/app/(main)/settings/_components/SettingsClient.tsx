'use client';

import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/features/i18n/components/LanguageSwitcher';
import { NotificationSettingsSection } from '@/features/settings/components/NotificationSettingsSection';
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection';
import { PolicySection } from '@/features/settings/components/PolicySection';
import { AccountActionsSection } from '@/features/settings/components/AccountActionsSection';
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
      <Section title={t('notifications.section')}>
        <NotificationSettingsSection />
      </Section>

      <Section title={t('account.section')}>
        <AccountSettingsSection />
      </Section>

      <Section title={t('language')}>
        <LanguageSwitcher />
      </Section>

      <Section title={t('policy.section')}>
        <PolicySection />
      </Section>

      <Section title={t('account.section')}>
        <AccountActionsSection />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}
