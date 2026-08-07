import { useTranslations } from 'next-intl';
import { LogoMark } from '@/components/brand/LogoMark';
import styles from './SplashScreen.module.scss';

/**
 * 스플래시 — Figma `auth / SPLASH` (360x720).
 *
 *   흰 배경, 화면 정중앙에 137x160 블록 (V gap 20, 가운데 정렬)
 *   ├ 로고 마크 92x85
 *   └ V gap 4 : 브랜드명 Title/B_24_130% #151515
 *                태그라인 Basic Body/R_14_140% #393939
 *
 * 라우트가 아니라 앱 부트스트랩 로딩 UI 로 쓴다 (`app/loading.tsx`) —
 * 시안의 SPLASH → LOGIN 흐름에서 SPLASH 가 차지하는 자리가 웹에서는
 * "첫 셸이 준비되기 전" 이기 때문. 별도 /splash 라우트를 만들면 아무도
 * 이동하지 않는 죽은 경로가 된다.
 */
export function SplashScreen() {
  const t = useTranslations('brand');

  return (
    <div className={styles.screen}>
      <div className={styles.block}>
        <LogoMark size={92} />
        <div className={styles.text}>
          <p className={styles.name}>{t('name')}</p>
          <p className={styles.tagline}>{t('tagline')}</p>
        </div>
      </div>
    </div>
  );
}
