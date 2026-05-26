import Image, { type ImageProps } from 'next/image';

/**
 * <OptimizedImage />
 *
 * next/image 의 래퍼. 다음을 자동 적용:
 *   - AVIF/WebP 우선 (next.config의 images.formats 기본값)
 *   - lazy loading (priority 미지정 시)
 *   - blur placeholder (외부 이미지의 경우 blurDataURL 직접 지정 권장)
 *   - 적절한 sizes hint
 *
 * 사용:
 *   // 상단 hero (LCP)
 *   <OptimizedImage src={url} alt="..." priority fill sizes="100vw" />
 *
 *   // 카드 썸네일
 *   <OptimizedImage src={url} alt="..." width={120} height={120} sizes="120px" />
 *
 *   // 리스트 (반응형)
 *   <OptimizedImage
 *     src={url} alt="..." fill
 *     sizes="(max-width: 600px) 100vw, 50vw"
 *   />
 *
 * 성능 노트:
 *   - sizes 를 정확히 주면 next/image 가 적정 해상도만 다운로드
 *   - priority 는 LCP 후보(첫 화면 큰 이미지)에만 적용
 *   - width/height 또는 fill 둘 중 하나는 필수 (CLS 방지)
 */

const FALLBACK_BLUR =
  // 1x1 회색 픽셀 base64 (placeholder만으로 충분)
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

type Props = Omit<ImageProps, 'placeholder' | 'blurDataURL'> & {
  blurDataURL?: string;
  /** placeholder를 강제로 비활성화 */
  noPlaceholder?: boolean;
};

export function OptimizedImage({
  blurDataURL,
  noPlaceholder,
  loading,
  priority,
  ...props
}: Props) {
  // priority=true 이면 next/image 가 loading 속성을 무시하지만 명시적으로 안 줌
  const placeholderProps = noPlaceholder
    ? {}
    : ({
        placeholder: 'blur' as const,
        blurDataURL: blurDataURL ?? FALLBACK_BLUR,
      });

  return (
    <Image
      {...props}
      {...placeholderProps}
      loading={priority ? undefined : (loading ?? 'lazy')}
      priority={priority}
    />
  );
}
