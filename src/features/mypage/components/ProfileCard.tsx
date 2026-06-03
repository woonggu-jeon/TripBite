'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { User } from 'lucide-react';
import { useMypage } from '@/features/mypage/hooks/use-mypage';
import { Card } from '@/components/ui';
import { haptic } from '@/lib/haptic';
import styles from './ProfileCard.module.scss';

/**
 * 프로필 카드 — 원형 아바타 + 닉네임 + 카메라 floating btn (이미지 변경).
 *
 * 이미지 업로드:
 *   - 현재는 클라이언트 object URL preview 만 (mock 환경)
 *   - 백엔드 붙은 후 multipart 업로드 + profile.avatarUrl 동기화
 */
export function ProfileCard() {
  const t = useTranslations('mypage.profile');
  const { data, isLoading } = useMypage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // object URL revoke (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onPick = () => {
    haptic.tap();
    fileRef.current?.click();
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (localPreview) URL.revokeObjectURL(localPreview);
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    // TODO(backend): mypageApi.updateAvatar(file) mutation 호출.
    e.target.value = '';
  };

  const nickname = data?.profile.nickname ?? (isLoading ? '' : t('anonymous'));
  const avatarSrc = localPreview;

  return (
    <Card
      as="article"
      variant="highlighted"
      padding="md"
      className={styles.card}
    >
      <button
        type="button"
        className={styles.avatarBtn}
        onClick={onPick}
        aria-label={t('changeAvatar')}
      >
        <span className={styles.avatar}>
          {avatarSrc ? (
            // object URL 은 next/image 사용 부적합 → 일반 img.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={t('avatarAlt', { nickname })}
              className={styles.avatarImg}
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden>
              <User size={36} />
            </span>
          )}
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      <h2 className={styles.nickname}>
        {nickname || <span className={styles.nicknameSkeleton} aria-hidden />}
      </h2>

      <TravelTypeField travelType={data?.travelType ?? undefined} />
    </Card>
  );
}

/**
 * 여행 유형 표시 영역 — 유형이 저장되어 있을 때만 렌더.
 *
 * 미설정 상태에서는 어떤 UI 도 노출하지 않는다 (CTA 도 X).
 * 유형 적용은 /quiz 결과 페이지의 "내 유형으로 적용" 버튼으로만 수행.
 */
function TravelTypeField({
  travelType,
}: {
  travelType?: {
    code?: string;
    title?: string;
    description?: string;
    emoji?: string;
  };
}) {
  const t = useTranslations('mypage.profile.travelType');
  if (!travelType?.title) return null;
  return (
    <div className={styles.travelType} role="group" aria-label={t('label')}>
      <span className={styles.travelTypeEmoji} aria-hidden>
        {travelType.emoji ?? '✨'}
      </span>
      <div className={styles.travelTypeBody}>
        <p className={styles.travelTypeLabel}>{t('label')}</p>
        <p className={styles.travelTypeTitle}>{travelType.title}</p>
        {travelType.description && (
          <p className={styles.travelTypeDesc}>{travelType.description}</p>
        )}
      </div>
    </div>
  );
}
