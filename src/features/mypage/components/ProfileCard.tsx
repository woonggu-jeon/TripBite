'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Camera, User, X } from 'lucide-react';
import { Icon } from '@/components/icon';
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

// 업로드 정책: 이미지 파일만 · ≤10MB. BE spec 도 동일 정책 (image/*, ≤10MB) 가정 — 다르면 BE 422.
// MIME 검증은 file.type.startsWith('image/') — accept="image/*" 와 동일 의미. PWA(iOS/Android) 친화.
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/**
 * 프로필 카드 — 원형 아바타 + 닉네임 + 카메라 floating btn (이미지 변경).
 *
 * 이미지 업로드:
 *   1) 파일 선택 → client object URL 즉시 preview (optimistic)
 *   2) POST /me/avatar (multipart) → BE 가 스토리지 업로드 + {avatarUrl} 응답
 *   3) onSuccess 시 /me + /mypage cache invalidate → 응답의 avatarUrl 이 정식 source
 *   업로드 실패 시 preview revoke + toast.
 */
export function ProfileCard() {
  const t = useTranslations('mypage.profile');
  const { data, isLoading } = useMypage();
  const { data: me } = useMe();
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();
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
    // 같은 파일 재선택 가능하도록 value clear (accept 통과 후에도 다시 같은 path 가능).
    e.target.value = '';
    if (!file) return;
    // 이미지 외 차단 — file.type 이 'image/png' / 'image/jpeg' 등 image/* 일 때만.
    // 일부 OS 가 type 을 못 정할 때 빈 string — 보수적으로 차단.
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
        // 실패 시 preview 롤백 + toast.
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
  // 표시 우선순위: 업로드 직후 preview > /me 응답의 avatarUrl > 미설정 fallback.
  // preview 는 mutation 완료 후 invalidate 로 /me 갱신되면 자연스럽게 사라짐.
  const avatarSrc = localPreview ?? secureImageUrl(me?.avatarUrl);
  const hasAvatar = !!avatarSrc;

  return (
    <article className={styles.card}>
      <div className={styles.avatarWrap}>
        <button
          type="button"
          className={styles.avatarBtn}
          onClick={onPick}
          aria-label={t('changeAvatar')}
        >
          <span className={styles.avatar}>
            {localPreview ? (
              // 업로드 직후 client-side object URL (URL.createObjectURL) —
              // next/image 부적합 (외부 host 가 아니라 blob:). 일반 img 정당.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={localPreview}
                alt={t('avatarAlt', { nickname })}
                className={styles.avatarImg}
              />
            ) : avatarSrc ? (
              // server avatar URL (R2/CDN) — next/image 로 AVIF/WebP 변환 활용.
              // fill + sizes 로 컨테이너(80px) 정합.
              <Image
                src={avatarSrc}
                alt={t('avatarAlt', { nickname })}
                fill
                sizes="100px"
                className={styles.avatarImg}
              />
            ) : (
              <span className={styles.avatarFallback} aria-hidden>
                <User size={24} />
              </span>
            )}
          </span>
          {/* Figma `cam-badge` 22px — 아바타 우하단 초록 원 + 2px 흰 링 */}
          <span className={styles.camBadge} aria-hidden>
            <Camera size={12} />
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
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        // PWA 친화: image/* 는 iOS/Android 의 파일 선택 dialog 가 카메라/갤러리/파일 모두 노출.
        // multiple=false (default) — 단일 파일만. capture 미지정 — 사용자가 카메라/앨범 선택권 보유.
        accept="image/*"
        className={styles.fileInput}
        onChange={onFile}
        aria-hidden
        tabIndex={-1}
      />

      {/* Figma `pmid` — 닉네임(18 Bold) + 유형 배지(pill), V gap 4 */}
      <div className={styles.body}>
        <h2 className={styles.nickname}>
          {nickname || <span className={styles.nicknameSkeleton} aria-hidden />}
        </h2>

        <TravelTypeField travelType={data?.travelType ?? undefined} />
      </div>
    </article>
  );
}

/**
 * 여행 유형 배지 — Figma `badge`: 연초록 pill + 12px compass + Caption/B_10.
 *
 * 유형 테스트를 한 번도 안 했으면 "새내기 여행자" 로 표시한다 (시안도 이 상태를
 * 그려두었다). 이전 구현은 유형이 없으면 아무 것도 렌더하지 않아 닉네임 아래가
 * 비어 있었다. 유형 적용은 /quiz 결과의 "내 유형으로 적용" 으로만 수행.
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
  const label = travelType?.title ? `#${travelType.title}` : t('rookie');
  return (
    <div className={styles.travelType} role="group" aria-label={t('label')}>
      <Icon
        name="compass"
        size={12}
        className={styles.travelTypeIcon}
        aria-hidden
      />
      <p className={styles.travelTypeTitle}>{label}</p>
    </div>
  );
}
