'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { User, X, Compass } from 'lucide-react';
import { useMe } from '@/features/auth/hooks/use-auth';
import {
  useMypage,
  useRemoveAvatar,
  useUpdateAvatar,
} from '@/features/mypage/hooks/use-mypage';
import { secureImageUrl } from '@/lib/secure-image-url';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import styles from './ProfileCard.module.scss';

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/**
 * 프로필 row — Figma "MY_01 마이페이지" pf frame (2026-06-23) 정합.
 *
 * Card primitive (highlighted wrap) → flat horizontal row.
 * - avatar 56x56 primary-soft bg + User icon (fallback) / user image
 * - cam-badge 22x22 right -2 bottom -2 (avatar 변경 트리거 — Figma 의 의미는
 *   카메라이지만 우리 동작은 file picker / 제거)
 * - 닉네임 (Inter ExtraBold 18 130% -0.03em)
 * - badge "새내기 여행자" pill (primary-soft bg + compass icon 13 + Bold 12
 *   primary) — 빈 상태 default. travelType.title 이 있으면 그 값 우선.
 */
export function ProfileCard() {
  const t = useTranslations('mypage.profile');
  const { data, isLoading } = useMypage();
  const { data: me } = useMe();
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

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
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('avatarInvalidType'));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t('avatarTooLarge'));
      return;
    }
    if (localPreview) URL.revokeObjectURL(localPreview);
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    updateAvatar.mutate(file, {
      onError: () => {
        URL.revokeObjectURL(url);
        setLocalPreview(null);
        toast.error(t('avatarUploadFailed'));
      },
      onSuccess: () => {
        toast.success(t('avatarUploaded'));
      },
    });
  };

  const onRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.tap();
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    removeAvatar.mutate(undefined, {
      onSuccess: () => toast.success(t('avatarRemoved')),
      onError: () => toast.error(t('avatarRemoveFailed')),
    });
  };

  const nickname = data?.profile.nickname ?? (isLoading ? '' : t('anonymous'));
  const avatarSrc = localPreview ?? secureImageUrl(me?.avatarUrl);
  const hasAvatar = !!avatarSrc;
  // travelType 있으면 그 라벨, 없으면 "새내기 여행자" (Figma default badge).
  const badgeLabel = data?.travelType?.title ?? t('badgeNewbie');

  return (
    <section className={styles.row} aria-label={t('label')}>
      <div className={styles.avatarWrap}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={onPick}
          aria-label={t('changeAvatar')}
        >
          <span className={styles.avatar}>
            {localPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={localPreview}
                alt={t('avatarAlt', { nickname })}
                className={styles.avatarImg}
              />
            ) : avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={t('avatarAlt', { nickname })}
                fill
                sizes="56px"
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarFallback} aria-hidden>
                <User size={27} strokeWidth={1.9} />
              </span>
            )}
          </span>
        </button>
        {hasAvatar && (
          <button
            type="button"
            className={styles.avatarRemoveBtn}
            onClick={onRemove}
            aria-label={t('removeAvatar')}
            disabled={removeAvatar.isPending}
          >
            <X size={12} aria-hidden />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className={styles.fileInput}
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      <div className={styles.pmid}>
        <h2 className={styles.nickname}>
          {nickname || <span className={styles.nicknameSkeleton} aria-hidden />}
        </h2>
        <span
          className={styles.badge}
          role="status"
          aria-label={t('badgeAria')}
        >
          <Compass size={13} className={styles.badgeIcon} aria-hidden />
          <span className={styles.badgeLabel}>{badgeLabel}</span>
        </span>
      </div>
    </section>
  );
}
