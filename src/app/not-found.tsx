import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Icon } from '@/components/icon/Icon';
import styles from './error.module.scss';

/**
 * 404 — EmptyState hero 패턴으로 디자인 통일 (2026-06-24).
 * 서버 컴포넌트 — getTranslations 로 로케일 반영(루트 layout 의 intl 컨텍스트).
 */
export default async function NotFound() {
  const t = await getTranslations('errors.notFound');
  return (
    <main className={styles.main}>
      <EmptyState
        variant="default"
        icon={<Icon name="compass" size={36} />}
        title={t('title')}
        description={t('description')}
        action={
          <Link href="/" className={styles.homeLink}>
            {t('goHome')}
          </Link>
        }
      />
    </main>
  );
}
