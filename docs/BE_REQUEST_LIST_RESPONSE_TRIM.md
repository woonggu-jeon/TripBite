# BE 요청 — list 응답 unused 필드 제거 (응답 크기 절감)

> 작성: 2026-06-11
> 영향: 4개 endpoint 의 응답 크기 절감. 가장 큰 영향은 Destination list (배열 16-32 row × description 길이)
> 우선순위: P2 (성능 개선, FE 사용 0건 검증됨 — backward compatible)

---

## 요약

| 영역                        | 필드          | 제거 사유                                                 |
| --------------------------- | ------------- | --------------------------------------------------------- |
| **Destination (list 전용)** | `description` | list 카드에 미노출. detail 응답엔 유지                    |
| **SavedTournament**         | `meetChance`  | FE 0 사용. Lucky Ladder 가 deterministic seed 로 generate |
| **Notification**            | `imageUrl`    | list row 에서 미노출. body/title 만 표시                  |
| **RegionContent**           | `contentId`   | FE 0 사용. detail 진입은 `id` 로                          |

---

## 1. Destination list 응답에서 `description` 제거

### 영향 endpoint

- `GET /destinations/random` — 매치업 후보 16-32 개 배열
- `GET /destinations/:id/related` — 같은 시군 6 개
- `GET /destinations/:id` (**detail**) — `description` 유지 (WinnerDetailPanel 의 `summary ?? description` fallback)

### FE 사용 검증

- list 카드 (`MatchupCard`, `WinnerCard`, `DestinationCard`, `RelatedDestinations`) — `id`, `name`, `category`, `region`, `imageUrl` 만 사용. `description` grep 0건
- 단수 detail (`WinnerDetailPanel.tsx:97`) — `detail.summary ?? detail.description` 사용 → detail 응답엔 유지 필요

### 권장 DTO 분리

NestJS 측에서 두 DTO 분리:

```ts
// list response — description 제외
class DestinationDto {
  id: string;
  name: string;
  category: DestinationCategory;
  region: RegionCode;
  imageUrl?: string;
}

// detail response — description 포함
class DestinationDetailDto extends DestinationDto {
  description?: string;
  // ... 기존 detail 필드 (summary, coords, photos, etc.)
}
```

→ list 응답 size: TourAPI description 평균 ~500-2000 bytes × 16-32 row = **~10-60KB 절감/요청**

---

## 2. SavedTournament.meetChance 제거

### 영향 endpoint

- `GET /mypage/tournaments`

### FE 사용 검증

- `meetChance` 필드 grep — 0건
- `TournamentResultClient` 는 `useTournamentRecord` 별도 endpoint (`/tournaments/:id`) 사용 + `LuckyLadder` 가 winner.id seed 로 client deterministic generate

### 권장

```ts
class SavedTournamentDto {
  id: string;
  destination: DestinationDto;
  luckyColor: string;
  // meetChance 제거
  savedAt: string;
}
```

---

## 3. Notification.imageUrl 제거

### 영향 endpoint

- `GET /notifications`

### FE 사용 검증

- `NotificationsClient.tsx:216` — `n.body ?? n.title` 만 표시
- `n.imageUrl` 사용처 grep — 0건

### 권장

```ts
class AppNotificationDto {
  // ... 기존 필드
  // imageUrl 제거
}
```

알림에 이미지 표시 기능 도입 시 다시 추가 가능.

---

## 4. RegionContent.contentId 제거 (선택)

### 영향 endpoint

- `GET /regions/:code/contents`

### FE 사용 검증

- `contentId` (TourAPI 원본 ID) FE 사용 grep — 0건
- FE 는 `id` (`tour-<contentid>`) 로 `/destination/:id` navigate

### 권장

BE 가 내부 추적용으로 필요하면 유지, 아니면 응답에서 제거.

---

## 예상 응답 크기 절감

| Endpoint                                     | Before                        | After (예상) | 절감     |
| -------------------------------------------- | ----------------------------- | ------------ | -------- |
| `GET /destinations/random?tournamentSize=32` | ~50KB (description 포함)      | ~5KB         | **~90%** |
| `GET /destinations/:id/related`              | ~15KB                         | ~2KB         | **~85%** |
| `GET /mypage/tournaments`                    | meetChance 포함 시 ~5% over   | -5%          | 작음     |
| `GET /notifications?limit=20`                | imageUrl 포함 시 ~10-20% over | -10-20%      | 중간     |

가장 큰 효과 — **Destination list** (토너먼트 매치업이 사용자당 N회 실행 = 트래픽 핵심).

---

## FE 측 후속 작업 (BE 작업 완료 시)

```bash
npm run generate:api && git commit src/api/generated/
```

- `DestinationDto.description` 자동 제거 (orval)
- `SavedTournamentDto.meetChance` 자동 제거
- `AppNotificationDto.imageUrl` 자동 제거
- 사용 0건이므로 FE 코드 변경 0건

mock handler (`src/mocks/handlers.ts`) 도 동기화 (해당 필드 응답에서 제거).

예상 FE 작업: S (≤10분).

---

## 검증 방법 (BE 측)

작업 완료 후:

1. Swagger UI `/docs` 의 각 endpoint 응답 schema 가 축소되어 보임
2. 실 응답 body 가 해당 필드 omit
3. 응답 크기 비교 (curl + wc -c)
