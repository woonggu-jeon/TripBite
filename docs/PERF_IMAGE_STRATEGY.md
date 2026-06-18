# FE Image Performance — 동접 200-300명 대비 전략

**작성일**: 2026-06-18
**갱신**: 2026-06-18 — Phase 1 (A+B) 적용 완료 + artillery loadtest 셋업
**상태**: Phase 1 적용 후 부하 측정 단계
**핵심 제약**: TourAPI 이미지는 공공 API URL 그대로 사용 (`http://tong.visitkorea.or.kr/cms/...`). BE 변환 불가. **FE 만으로 가능한 옵션** 정리.

## 진행 상태

- [x] **B. deviceSizes/imageSizes 단순화** — 7×8 → 3×4 (`next.config.js`)
- [x] **A. SW cache 의 `/_next/image` 패턴 추가** — CacheFirst 30일, maxEntries 500 (`src/app/sw.ts`)
- [x] **artillery loadtest 셋업** — `npm run loadtest` / `npm run loadtest:report`
- [ ] C. sizes prop 정밀화 — 현재 점검 결과 대부분 적절, 큰 임팩트 없어 skip
- [ ] D. 외부 image CDN 도입 — Phase 1 효과 1-2주 모니터링 후 결정
- [ ] E. unoptimized 폴백 — 최종 안전망

## TL;DR

| 옵션                                        | 비용  | 효과                             |
| ------------------------------------------- | ----- | -------------------------------- |
| **A. SW cache 에 `/_next/image` 패턴 추가** | 30분  | 재방문 시 Vercel transform 0     |
| **B. deviceSizes/imageSizes 단순화**        | 5분   | 한 이미지당 variant 수 ~60% 감소 |
| **C. sizes prop 정밀화**                    | 1시간 | 변환 호출 ~20-30% 감소           |
| **D. 외부 image CDN 도입**                  | 1-2일 | Vercel transform **0** 사용      |
| **E. `unoptimized` 모드**                   | 5분   | Vercel transform 0 / LCP 손실    |

**가장 큰 single 효과 = A** (재방문 ratio 만큼 무료). 가장 robust 해결 = D (CDN).

---

## 1. 부하 추정 (재확인)

- 동접 200-300 → DAU 800-1600 → 일 PV 8k-32k → **월 PV 240k-960k**
- 페이지당 평균 image 10장 → **월 image transformation 240만-960만**
- Vercel Pro 한도: 5,000장/월 → **수십 배 초과**

## 2. 현 코드 상태 (점검 완료)

### `next.config.js`

```js
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'tong.visitkorea.or.kr' }],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],  // 7개
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],       // 8개
  minimumCacheTTL: 60 * 60 * 24 * 60,                    // 60일 ✅
}
```

**문제**:

- `deviceSizes × imageSizes` = 한 이미지당 최대 **15 variants** 생성 가능 — 카운트 빠르게 소진

### `sizes` prop 사용처 (15개)

- ✅ 잘 적용: `DestinationCard sizes="(max-width: 480px) 50vw, 200px"`, `MediaThumb sizes="56px"` 등
- ⚠️ 점검: `DestinationPhotos sizes="(max-width: 720px) 100vw, 720px"` (큰 사이즈 — detail 페이지)

### Service Worker (`src/app/sw.ts`)

```ts
{
  // TourAPI 이미지 — CacheFirst 30일, maxEntries 200
  matcher: /^https:\/\/tong\.visitkorea\.or\.kr\/.+\.(?:jpe?g|png|webp|avif)$/i,
  handler: new CacheFirst({ cacheName: 'tour-api-images', ... }),
}
```

**문제**:

- 우리 카드는 `next/image` 통과 → 실 URL 은 `/_next/image?url=https%3A//tong.visitkorea.or.kr/...&w=128&q=75`
- 이 URL 은 `tong.visitkorea` 패턴 **매치 안 됨**
- `defaultCache` 의 next/image 처리에 위임 — 매니페스트 확인 필요
- **재방문 시 SW cache 안 쓰면 Vercel transform 매번 호출**

---

## 3. FE 옵션 상세

### A. SW cache 에 `/_next/image` 패턴 추가 ⭐ (가장 큰 효과)

**적용**:

```ts
// src/app/sw.ts 의 runtimeCaching 에 추가
{
  matcher: /\/_next\/image\?.+url=.*tong\.visitkorea/i,
  handler: new CacheFirst({
    cacheName: 'next-optimized-tour',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
},
```

**효과**:

- 같은 사용자 첫 진입 시: 변환 1회 → SW 캐시
- 같은 사용자 재방문 시: SW 캐시 hit → Vercel 변환 0
- 재방문 ratio 50% 가정 시: 변환 호출 ~50% 절감
- 더 중요: 같은 페이지 안에서 같은 카드 재 렌더 (탭 전환 등) — SW 캐시 즉시 사용

**비용**: 30분, SW 한 줄 추가

### B. deviceSizes/imageSizes 단순화

**현재**: 7×8 = 15 variants 가능
**제안**:

```js
deviceSizes: [640, 1080, 1920],         // 3개
imageSizes: [64, 128, 256, 512],         // 4개
```

**효과**:

- 한 이미지당 variant 가 ~4-5개 (현재 ~10-15) → **60% 감소**
- 동일 URL 재 호출 시 캐시 hit ratio ↑
- 단점: 정확한 size 매칭 못해 약간 큰 이미지 다운로드 (모바일 데이터 +)

**비용**: 5분, config 한 줄

### C. sizes prop 정밀화

**현재 점검 결과**:

- ✅ `DestinationCard`: `"(max-width: 480px) 50vw, 200px"` — OK
- ✅ `MediaThumb`: `"56px"`, `"120px"` 등 — OK
- ⚠️ `DestinationPhotos`: `"(max-width: 720px) 100vw, 720px"` — desktop 큼
- ⚠️ `RegionHero` thumbWrap: `"64px"` — OK
- ⚠️ `ProfileCard`: `"100px"` — OK

**제안**:

- 카드 grid 에서 실제 카드 width 정확히 측정 후 `sizes` 매칭
- 큰 hero 이미지는 `sizes="(max-width: 480px) 100vw, 640px"` 등 desktop max 도 제한

**효과**: 잘못된 size 변환 호출 줄어 ~20-30%

**비용**: 1시간

### D. 외부 image CDN 도입

**옵션**:

1. **Cloudflare Images** — $5/월, 무제한 변환, 100k 이미지 저장
2. **ImageKit** — 무료 20GB / 월 transformation
3. **Bunny.net Optimizer** — $9.5/월 + bandwidth
4. **imgproxy self-host** — 직접 운영 (Cloudflare Workers + KV 등)

**적용** (Cloudflare Images 예):

```js
// next.config.js
images: {
  loader: 'custom',
  loaderFile: './src/lib/image-loader.ts',
}

// src/lib/image-loader.ts
export default function loader({ src, width, quality }) {
  return `https://imagedelivery.net/<account>/${encodeURIComponent(src)}/w=${width},q=${quality ?? 75},format=auto`;
}
```

**효과**:

- Vercel transform **0** 사용
- 외부 CDN 이 fetch + 변환 + 캐싱
- TourAPI URL 그대로 전달 가능 (CDN 이 origin fetch)

**비용**: 1-2일 + 월 $5-10

### E. `unoptimized` 모드 (폴백)

**적용**:

```tsx
<Image src={tourApiUrl} unoptimized ... />
```

또는 next.config 의 `images.unoptimized: true` (전체).

**효과**:

- Vercel transform 0
- 원본 그대로 → 4K JPG (TourAPI) 그대로 전달 → 모바일 데이터 / LCP 손실
- avif/webp 변환 안 됨

**비용**: 5분, 단 사용자 경험 trade-off 큼

---

## 4. SW 의 next/image 캐시 검증 (사전 확인 필요)

`@serwist/next/worker` 의 `defaultCache` 가 `/_next/image` 패턴 cover 하는지:

```bash
# node_modules 의 defaultCache 확인
grep -rA5 "_next/image" node_modules/@serwist/next/dist/worker/ 2>&1 | head
```

- 만약 cover 한다면 → 옵션 A 불필요 (이미 자동)
- 안 한다면 → 옵션 A 적용 필요

직전 SW config 보면 `...defaultCache` spread 가 마지막에 위치 — 우리 명시 matcher (TourAPI 원본 URL) 가 우선이지만 `/_next/image` 는 매치 안 함 → defaultCache 로 위임.

**확인 필요**: defaultCache 의 next/image 정책이 CacheFirst 인지 / NetworkFirst 인지. CacheFirst 면 무문제.

---

## 5. 권장 조합 (단계적)

### Phase 1 — 즉시 (1시간 이내)

1. **deviceSizes/imageSizes 단순화** (B) — 5분
2. **SW cache 의 next/image 패턴 명시 추가** (A) — 30분 (defaultCache 의 정책 검증 후)
3. `sizes` prop 점검 + 정밀화 — 1시간 (C)

**효과**: 변환 호출 ~70% 절감 (재방문 50% 가정 + variant 60% 감소)

### Phase 2 — 부하 측정 후 결정

- Vercel dashboard 의 image optimization 실 사용량 모니터링 (1-2주)
- Phase 1 만으로 한도 안전한지 측정
- 부족하면 **D (외부 image CDN)** 도입 결정

### Phase 3 — 폴백 (위 모두 불충분 시)

- E (`unoptimized`) — UX 손실 수용 가능 영역만 (예: detail photos)

---

## 6. 즉시 가능한 코드 변경 (수정 진행 결정 시)

### 6-1. `next.config.js`

```diff
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'tong.visitkorea.or.kr' }],
    formats: ['image/avif', 'image/webp'],
-   deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
-   imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
+   deviceSizes: [640, 1080, 1920],
+   imageSizes: [64, 128, 256, 512],
    minimumCacheTTL: 60 * 60 * 24 * 60,
  },
```

### 6-2. `src/app/sw.ts` — TourAPI image cache 위에 추가

```ts
{
  // next/image 가 최적화한 TourAPI 이미지 — CacheFirst 30일.
  // Vercel image optimization 한도 절감 (재방문 시 transform 호출 0).
  matcher: ({ url }) =>
    url.pathname === '/_next/image' &&
    url.searchParams.get('url')?.includes('tong.visitkorea') === true,
  handler: new CacheFirst({
    cacheName: 'next-optimized-tour',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
},
```

### 6-3. (옵션) 외부 CDN — `src/lib/image-loader.ts` 신설

```ts
export default function loader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Cloudflare Images / ImageKit / Bunny.net 등 선택
  const q = quality ?? 75;
  return `https://<your-cdn>/${encodeURIComponent(src)}?w=${width}&q=${q}&f=auto`;
}
```

```js
// next.config.js
images: {
  loader: 'custom',
  loaderFile: './src/lib/image-loader.ts',
  // 나머지 remotePatterns 등 유지
}
```

---

## 7. 의사결정 체크리스트

- [ ] Vercel Image Optimization 의 현재 실 사용량 (dashboard) 확인했나?
- [ ] `@serwist/next` 의 defaultCache 가 `/_next/image` 를 CacheFirst 로 처리하는지 확인했나?
- [ ] Phase 1 (5분~1시간) 만으로 한도 안전한지 측정 의향 있나?
- [ ] 외부 image CDN 도입 ($5-10/월) 비용 OK?
- [ ] `unoptimized` 모드의 LCP / 모바일 데이터 영향 수용 가능?

답 받으면 Phase 1 → Phase 2 진행 plan 확정.
