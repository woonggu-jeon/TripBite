'use client';

import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { BottomSheet } from '@/components/feedback/BottomSheet';
import { Icon } from '@/components/icon/Icon';
import { useMe } from '@/features/auth/hooks/use-auth';
import {
  useMypage,
  useRemoveAvatar,
  useUpdateAvatar,
} from '@/features/mypage/hooks/use-mypage';
import { haptic } from '@/lib/haptic';
import { secureImageUrl } from '@/lib/secure-image-url';
import { toast } from '@/lib/toast';
import styles from './ProfileCard.module.scss';

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/**
 * 프로필 row — Figma "MY_01 마이페이지" pf frame (2026-06-23) 정합.
 *
 * Card primitive (highlighted wrap) → flat horizontal row.
 * - avatar 56x56 primary-soft bg + User icon (fallback) / user image
 * - **cam-badge 22x22 right -2 bottom -2** — Camera icon 12 (Figma 정합).
 *   클릭 시 BottomSheet 열림 → 카메라 / 갤러리 / 제거 옵션.
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const onPick = () => {
    haptic.tap();
    setSheetOpen(true);
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

  const onRemove = () => {
    haptic.tap();
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    removeAvatar.mutate(undefined, {
      onSuccess: () => toast.success(t('avatarRemoved')),
      onError: () => toast.error(t('avatarRemoveFailed')),
    });
  };

  const triggerCamera = () => {
    setSheetOpen(false);
    cameraInputRef.current?.click();
  };
  const triggerGallery = () => {
    setSheetOpen(false);
    galleryInputRef.current?.click();
  };
  const triggerRemove = () => {
    setSheetOpen(false);
    onRemove();
  };

  const nickname = data?.profile.nickname ?? (isLoading ? '' : t('anonymous'));
  const avatarSrc = localPreview ?? secureImageUrl(me?.avatarUrl);
  const hasAvatar = !!avatarSrc;
  const badgeLabel = data?.travelType?.title ?? t('badgeNewbie');

  return (
    <>
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
                  <Icon name="user" size={27} />
                </span>
              )}
            </span>
          </button>
          {/* Figma cam-badge — 22x22 absolute right -2 bottom -2, primary bg
              + 2px white border + Camera icon 12 white. 항상 노출. 클릭 시
              avatar 변경 sheet 열기. */}
          <button
            type="button"
            className={styles.cameraBtn}
            onClick={onPick}
            aria-label={t('changeAvatar')}
          >
            <Icon name="camera" size={12} />
          </button>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.fileInput}
          onChange={onFile}
          aria-hidden
          tabIndex={-1}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className={styles.fileInput}
          onChange={onFile}
          aria-hidden
          tabIndex={-1}
        />

        <div className={styles.pmid}>
          <h2 className={styles.nickname}>
            {nickname || (
              <span className={styles.nicknameSkeleton} aria-hidden />
            )}
          </h2>
          <span
            className={styles.badge}
            role="status"
            aria-label={t('badgeAria')}
          >
            <Icon name="compass" size={13} className={styles.badgeIcon} />
            <span className={styles.badgeLabel}>{badgeLabel}</span>
          </span>
        </div>
      </section>

      {/* Figma "MY_01 · 프로필 사진 변경" bottom sheet (2026-06-23). */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('sheetTitle')}
        description={t('sheetDescription')}
      >
        <button
          type="button"
          className={styles.sheetOption}
          onClick={triggerCamera}
        >
          <span className={styles.sheetOptionIcon} aria-hidden>
            <Icon name="camera" size={22} />
          </span>
          <span className={styles.sheetOptionLabel}>
            {t('sheetOptionCamera')}
          </span>
        </button>
        <button
          type="button"
          className={styles.sheetOption}
          onClick={triggerGallery}
        >
          <span className={styles.sheetOptionIcon} aria-hidden>
            <Icon name="image" size={22} />
          </span>
          <span className={styles.sheetOptionLabel}>
            {t('sheetOptionGallery')}
          </span>
        </button>
        {hasAvatar && (
          <button
            type="button"
            className={styles.sheetOption}
            onClick={triggerRemove}
            disabled={removeAvatar.isPending}
          >
            <span className={styles.sheetOptionIcon} aria-hidden>
              <Trash2 size={22} strokeWidth={1.65} />
            </span>
            <span className={styles.sheetOptionLabel}>
              {t('sheetOptionRemove')}
            </span>
          </button>
        )}
      </BottomSheet>
    </>
  );
}
