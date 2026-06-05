'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { User, X } from 'lucide-react';
import { useMe } from '@/features/auth/hooks/use-auth';
import {
  useMypage,
  useRemoveAvatar,
  useUpdateAvatar,
} from '@/features/mypage/hooks/use-mypage';
import { Card } from '@/components/ui';
import { secureImageUrl } from '@/lib/secure-image-url';
import { haptic } from '@/lib/haptic';
import { toast } from '@/lib/toast';
import styles from './ProfileCard.module.scss';

// BE spec (docs/API_CONTRACT.md): `image/jpeg|png|webp`, ≤5MB. 다른 타입/크기는 client 에서 차단.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

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
    e.target.value = '';
    if (!file) return;
    if (
      !ALLOWED_AVATAR_TYPES.includes(
        file.type as (typeof ALLOWED_AVATAR_TYPES)[number],
      )
    ) {
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
    <Card
      as="article"
      variant="highlighted"
      padding="md"
      className={styles.card}
    >
      <div className={styles.avatarWrap}>
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
        accept="image/jpeg,image/png,image/webp"
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
      <p className={styles.travelTypeTitle}>#{travelType.title}</p>
    </div>
  );
}
