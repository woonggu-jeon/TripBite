'use client';

import { useTranslations } from 'next-intl';
// 언어 섹션 일단 미노출 (사용자 요청) — LanguageSwitcher 자체는 추후 복원용으로 유지.
// import { LanguageSwitcher } from '@/features/i18n/components/LanguageSwitcher';
import { NotificationSettingsSection } from '@/features/settings/components/NotificationSettingsSection';
import { AccountSettingsSection } from '@/features/settings/components/AccountSettingsSection';
// 약관 섹션 미노출 (사용자 요청, 2026-06-18). 정책 본문 확정 시 복원 — import + 아래 PageSection 만 살리면 됨.
// import { PolicySection } from '@/features/settings/components/PolicySection';
import { AccountActionsSection } from '@/features/settings/components/AccountActionsSection';
// 테마 섹션 미노출 (사용자 요청, 재노출 대비 import 유지)
// import { ThemeSection } from '@/features/theme/components/ThemeSection';
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
      {/* Figma "설정 bl" heading — padding 26 0 8 20 + SB_14 fg. PageSection
          wrap 제거 (header padding 26 정합이 PageSection 공통 spec 과 충돌 →
          settings 만 자체 bl heading 사용, 사용자 명시 2026-06-24). */}
      <div className={styles.bl}>{t('notifications.section')}</div>
      <NotificationSettingsSection />

      <div className={styles.bl}>{t('account.section')}</div>
      <AccountSettingsSection />

      {/* 테마 / 언어 / 약관 섹션 — 미노출 (사용자 요청). 추후 복원 시
          <div className={styles.bl}>{t('theme.section')}</div> 등으로 추가. */}

      {/* Figma "설정" page bw frame — 섹션 외 별도 영역. */}
      <AccountActionsSection />
    </div>
  );
}
