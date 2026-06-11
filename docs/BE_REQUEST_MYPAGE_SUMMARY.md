# BE 요청 — `GET /mypage` 응답에서 unused 필드 제거

> 작성: 2026-06-11
> 영향: 마이페이지 진입 시 응답 크기 ~70%+ 절감
> 우선순위: P2 (성능 개선, 기능 영향 없음 — backward compatible)

---

## 요약

`MypageSummaryDto` 응답에서 FE 가 안 쓰는 3 필드 제거:

| 필드               | FE 사용                             | BE 응답  |
| ------------------ | ----------------------------------- | -------- |
| `profile`          | ✅ ProfileCard / NicknameEditDialog | **유지** |
| `travelType`       | ✅ ProfileCard                      | **유지** |
| `savedTournaments` | ❌                                  | **제거** |
| `savedLetters`     | ❌                                  | **제거** |
| `likedLetters`     | ❌                                  | **제거** |

---

## 배경

`GET /mypage` 응답 (`MypageSummaryDto`):

```ts
{
  profile: ProfileDto;
  savedTournaments: SavedTournamentDto[];   // 최대 20개
  savedLetters: LetterDto[];                 // 다수
  likedLetters: LetterDto[];                 // 다수
  travelType: TravelTypeDto | null;
}
```

**FE 측 실 사용** (정밀 확인 — 2026-06-11):

- `ProfileCard.tsx:94, 158`: `data.profile.nickname` + `data.travelType`
- `NicknameEditDialog.tsx:24`: `data.profile.nickname`
- **`savedTournaments`** — `SavedTournamentsSection` 이 별도 hook `useSavedTournaments` (`GET /mypage/tournaments`) 호출. summary 의 필드 안 씀
- **`savedLetters` / `likedLetters`** — 마이페이지에 편지 영역 미노출 (요구사항 §mypage). 어디서도 안 씀

→ 응답의 약 70% 데이터가 FE 에서 무시됨.

---

## 요청 변경

### `MypageSummaryDto` 응답 spec

**Before**:

```ts
interface MypageSummaryDto {
  profile: ProfileDto;
  savedTournaments: SavedTournamentDto[];
  savedLetters: LetterDto[];
  likedLetters: LetterDto[];
  travelType: TravelTypeDto | null;
}
```

**After**:

```ts
interface MypageSummaryDto {
  profile: ProfileDto;
  travelType: TravelTypeDto | null;
}
```

### 정책

- BE 가 응답 build 시 위 3 필드 omit
- 다른 endpoint (`/mypage/tournaments`, `/letters/{saved,liked}`) 와 영역 분리 — 각자 독립 fetch
- backward compatible 측면: 응답에서 필드가 사라지지만 FE 가 안 쓰므로 무영향. orval generated DTO 가 자동 갱신

---

## FE 측 후속 작업 (BE 작업 완료 시)

```bash
npm run generate:api && git commit src/api/generated/  # orval 재생성
```

`MypageSummaryDto` 가 자동으로 축소된 타입 반영. FE 코드 변경 0건 (이미 안 쓰는 필드이므로).

예상 작업량: S (≤5분, BE swagger 변경 + FE generate).

---

## 검증 방법 (BE 측)

작업 완료 후:

1. Swagger UI `/docs` 의 `GET /mypage` 응답 schema 에 `profile` + `travelType` 만 노출
2. 실 호출 응답 body 가 두 필드만 포함 — `curl -H "Cookie: SID=..." https://tripbite.duckdns.org/v1/mypage | jq` 로 확인
3. 응답 크기 비교 — 기존 vs 신규 (대개 70%+ 감소 예상)

---

## 연관 작업

- 동시 진행 (FE): 편지 like/save/delete 토글의 invalidate 정합 누락 fix (`list('saved')`, `list('sent')` 추가)
- 미래 옵션: `MypageSummaryDto` 의 다른 deprecation 도 추적

---

## 운영 영향

- 응답 크기 ↓ (편지 다수일 경우 더 큼)
- DB 쿼리 ↓ (BE 가 saved/liked letter join 안 함)
- Lambda 응답 시간 ↓ (직렬화 비용 감소)
- 무영향: FE UI (이미 별도 endpoint 로 fetch 중)
