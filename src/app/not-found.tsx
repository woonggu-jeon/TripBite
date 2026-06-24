import Link from 'next/link';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import styles from './error.module.scss';

/**
 * 404 — EmptyState hero 패턴으로 디자인 통일 (2026-06-24).
 */
export default function NotFound() {
  return (
    <main className={styles.main}>
      <EmptyState
        variant="hero"
        icon={<Compass size={40} strokeWidth={1.6} aria-hidden />}
        title="페이지를 찾을 수 없어요"
        description={'요청하신 페이지가 사라졌거나\n잘못된 주소예요.'}
        action={
          <Link href="/" className={styles.homeLink}>
            홈으로
          </Link>
        }
      />
    </main>
  );
}
