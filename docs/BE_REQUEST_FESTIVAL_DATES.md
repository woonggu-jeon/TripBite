# BE 요청 — `/destinations/:id` 응답에 축제 일정 필드 추가

> 작성: 2026-06-10
> 영향: FE 의 Event JSON-LD (schema.org) 적용 가능 — SERP 의 "이벤트" rich result 노출 조건
> 우선순위: P1 (SEO 개선, blocking 아님)

---

## 요약

`/destinations/:id` 의 `DestinationDetailDto` 에 **선택적** 일정 필드 추가:

- `eventStart?: string` (ISO 8601, e.g. `2026-10-14`)
- `eventEnd?: string` (ISO 8601, e.g. `2026-10-16`)

`category === 'festival'` 인 destination 에서만 채워지면 충분.
다른 카테고리 (attraction/experience/local) 는 `undefined` 그대로.

---

## 배경

FE 는 `/destination/[id]` 페이지에서 schema.org 의 [Event](https://schema.org/Event) 구조화 데이터를 응답으로 내고 싶음.

**현황** (FE 가 이미 출력 중):

```json
{
  "@context": "https://schema.org",
  "@type": "Festival",
  "name": "청주공예비엔날레",
  "address": { "@type": "PostalAddress", "addressLocality": "청주시" }
}
```

**목표** — `Event` schema 필수 필드 (`name`, `startDate`) + 권장 필드 (`endDate`) 보강:

```json
{
  "@context": "https://schema.org",
  "@type": "Festival",
  "name": "청주공예비엔날레",
  "startDate": "2026-10-14",
  "endDate": "2026-11-23",
  "location": { "@type": "Place", "name": "청주시", ... }
}
```

이 schema 가 충족되면 Google SERP 에 "이벤트 카드" (날짜 + 장소 + 링크) 가 노출 — 축제 트래픽 견인.

---

## 데이터 출처

TourAPI (한국관광공사) 의 `detailIntro` endpoint 가 축제 콘텐츠에 대해 이미 다음 필드를 노출:

- `eventstartdate` (YYYYMMDD)
- `eventenddate` (YYYYMMDD)

BE 는 이를 fetch 후 ISO 8601 (`YYYY-MM-DD`) 로 정규화해서 응답 DTO 에 포함하면 됨.

`FestivalDto` (현재 generated) 에는 이미 `eventStart` / `eventEnd` 가 있음 (`/festivals` endpoint). 동일 필드명을 `DestinationDetailDto` 에도 적용.

---

## 요청 변경 사항

### `DestinationDetailDto` (Swagger schema)

추가 (둘 다 optional):

```ts
{
  // ... 기존 필드
  eventStart?: string;  // ISO 8601 YYYY-MM-DD, festival 전용
  eventEnd?: string;    // ISO 8601 YYYY-MM-DD, festival 전용
}
```

### 응답 정책

- `category === 'festival'` & TourAPI 데이터에 일정 존재 → 두 필드 모두 채워서 응답
- `category === 'festival'` & TourAPI 일정 없음 → 두 필드 모두 omit (또는 `null`)
- 다른 카테고리 → 두 필드 omit

backward compatible — 기존 FE 코드는 두 필드 무시해도 동작.

---

## FE 측 후속 작업 (BE 작업 완료 시)

1. `npm run generate:api` 로 orval 재생성 → `DestinationDetailDto` 에 두 필드 자동 추가
2. `src/app/(main)/destination/[id]/page.tsx` 에서 detail fetch 추가 (현재 seed 만 사용)
3. `src/lib/json-ld.tsx` 의 `touristAttraction()` 를 확장 — festival 인 경우 startDate/endDate 가 있으면 Event schema 로 분기
4. mock seed (`src/mocks/seeds/destinations.ts`) 에 sample date 추가 — dev 환경 검증용

예상 작업량: S (≤30분), 위 4단계 모두.

---

## 검증 방법 (BE 측)

작업 완료 후:

1. Swagger UI `/docs` 의 `GET /destinations/:id` 에서 schema 가 `eventStart/eventEnd` 노출
2. 실제 festival id 호출 시 두 필드 채워짐 (예: `청주공예비엔날레` id)
3. 비-festival 호출 시 두 필드 미존재 (omit)

FE 측은 위 보강 후 [Google Rich Results Test](https://search.google.com/test/rich-results) 로 Event schema 가 valid 인지 검증.

---

## 연관 문서

- 보류 사유 기록: [BACKLOG.md §0-SEO](BACKLOG.md)
- 현재 JSON-LD 출력 위치: `src/app/(main)/destination/[id]/page.tsx`
- helper: `src/lib/json-ld.tsx` (`touristAttraction()`)
