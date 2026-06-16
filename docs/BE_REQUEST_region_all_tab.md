# BE 요청서 — 시군 contents `type=all` 쿼리 enum 명시 (응답 enum 무변경)

**상태**: 갱신 — 응답 enum 오염 회피로 설계 변경
**작성일**: 2026-06-16 (갱신: 동일일)
**관련**: `GET /v1/regions/:code/contents`

## 배경

`/region/:code` 페이지 탭 구성을 `[관광지 | 축제 | 체험]` → `[전체 | 관광지 | 축제 | 체험]` 로 확장.

**중요**: `all` 은 카테고리가 아니라 **"필터 없음" 쿼리값**. `DestinationCategory` enum (DB 의 실제 분류) 에 섞으면 안 됨.

- `DestinationCategory` 는 응답 item 의 실제 분류 — 어떤 여행지도 `category: 'all'` 일 수 없음
- enum 에 추가하면 `DestinationDto.category`, `RegionContentDto.type` 등 응답 type 전반에 가짜 값 오염
- enum 마이그레이션 비용 + 직전 `local` cleanup 흐름 역행 + 502 위험

## 현재 상태 — 코드상 이미 동작

`region.service.ts:43` 가 `type` 이 `attraction|festival|experience` 가 아니면 필터 미적용 → 전체 카테고리 통합 응답.

즉 **현재도** 다음이 동작:

```bash
# type 생략
GET /v1/regions/cheongju/contents?cursor=...&limit=10
# 또는 type=all (BE 가 unknown 으로 처리해 동일)
GET /v1/regions/cheongju/contents?type=all&cursor=...&limit=10
```

FE 는 'all' 탭 클릭 시 `type` 파라미터를 omit 으로 전송하도록 이미 구현 — BE 변경 없이 즉시 동작.

## 요청 — OpenAPI 의 query-level enum 만 분리 (선택 / 정합성용)

응답 enum (`DestinationCategory`, 3값) 은 유지, **쿼리 파라미터에만** `'all'` 허용 명시:

```ts
// region.controller.ts
@Get(':code/contents')
@ApiQuery({
  name: 'type',
  required: false,
  enum: ['all', 'attraction', 'festival', 'experience'],
})
async contents(
  @Param('code') code: RegionCode,
  @Query('type') type?: 'all' | DestinationCategory,
  ...
)
```

효과:

- OpenAPI spec 의 query param 정합성 ↑ (Swagger UI 에서 `all` 도 선택 가능 자동 표시)
- FE orval generate 시 `RegionControllerContentsV1Params.type` 이 `'all' | 'attraction' | 'festival' | 'experience'` 로 좁혀짐 → typo 방지
- 응답 DTO 무변경 → 마이그레이션 0, DB enum 오염 0

서비스 로직 무변경 — `'all'` 분기를 BE 가 명시 처리하지 않아도, "필터 미적용" 동작이 이미 그렇게 작동.

## FE 측 처리 (완료)

- `src/features/region/api/region.ts` 에 `RegionContentFilter = DestinationCategory | 'all'` 신설 — 응답 enum 과 분리
- `regionApi.listContents` 가 `type === 'all'` 시 BE 에 `type` 미전달 (omit) — BE 의 unknown/미지정 분기 활용
- `RegionDetailTabs` 의 첫 탭이 `'all'` 로 활성화됨 — BE 작업 없이 동작

BE 가 OpenAPI 갱신 후엔 FE 는 omit 대신 명시 `type=all` 전달로 단순화 가능 (1 줄 변경).

## Acceptance

- [ ] (선택) `region.controller.ts` 의 `@ApiQuery` 에 `enum: ['all', ...]` 명시
- [ ] `npm run generate:api` 시 `RegionControllerContentsV1Params.type` enum 좁혀짐 확인
- [ ] **응답 `DestinationCategory` enum 변경 없음 — 3값 유지** (가장 중요)
