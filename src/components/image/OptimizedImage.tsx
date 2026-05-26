import Image, { type ImageProps } from 'next/image';

/**
 * <OptimizedImage />
 *
 * next/image 의 래퍼. 적용:
 *   - AVIF/WebP 우선 (next.config 의 images.formats)
 *   - lazy loading (priority 미지정 시)
 *   - blur placeholder (외부 이미지는 `getBlurDataURL()` from `@/lib/blur` 권장)
 *   - quality 기본값 75 — 모바일에선 시각 차이 거의 없음, 용량 30% 절감
 *
 * 사용:
 *   // 상단 hero (LCP)
 *   <OptimizedImage src={url} alt="..." priority fill sizes="100vw" />
 *
 *   // 카드 썸네일
 *   <OptimizedImage src={url} alt="..." width={120} height={120} sizes="120px" />
 *
 *   // 리스트 (반응형)
 *   <OptimizedImage src={url} alt="..." fill
 *     sizes="(max-width: 600px) 100vw, 50vw" />
 *
 * sizes 중요:
 *   sizes 를 정확히 주면 next/image 가 srcset 에서 적정 해상도만 다운로드.
 *   미지정 시 모든 해상도 후보 → 100vw 가정하므로 큰 파일 받음.
 *
 * priority:
 *   첫 화면 LCP 후보에만 (시군 hero, 토너먼트 우승지 메인).
 *   그 외는 lazy (기본).
 */

const FALLBACK_BLUR =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

type Props = Omit<ImageProps, 'placeholder' | 'blurDataURL'> & {
  blurDataURL?: string;
  noPlaceholder?: boolean;
};

export function OptimizedImage({
  alt,
  blurDataURL,
  noPlaceholder,
  loading,
  priority,
  quality = 75,
  ...props
}: Props) {
  const placeholderProps = noPlaceholder
    ? {}
    : {
        placeholder: 'blur' as const,
        blurDataURL: blurDataURL ?? FALLBACK_BLUR,
      };

  return (
    <Image
      {...props}
      {...placeholderProps}
      alt={alt}
      quality={quality}
      loading={priority ? undefined : (loading ?? 'lazy')}
      priority={priority}
    />
  );
}
