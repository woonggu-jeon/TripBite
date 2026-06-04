# Backend Plan — NestJS / Spring Boot 비교 + 배포 + ERD

FE 가 이미 11 도메인 / 45 endpoint 매칭 완료 (`AUTH_FLOWS.md` /
`NOTIFICATIONS.md` / mock handlers). BE stack 결정 + 공수 추정 + 배포 전략 +
ERD 초안 1차.

본 문서는 **의사결정 자료** — 구현 spec 은 도메인별 별도 문서.

---

## 0. 도메인 범위 (양쪽 stack 공통)

| 도메인             | Endpoint 수                                                    | 복잡도 | 외부 의존                |
| ------------------ | -------------------------------------------------------------- | ------ | ------------------------ |
| Auth               | 9 (login/signup/find-id/forgot/reset/change/logout/refresh/me) | 중     | Mail (SES/Resend)        |
| Letter             | 7 (compose/list/get/like/save/delete + push 발행)              | 중     | web-push, cron(3일 정리) |
| Tournament         | 6 (candidates/save/list-saved/remove/record/history/related)   | 중     | —                        |
| Destination/Region | 5 (content/random/related/detail/festivals)                    | 중-상  | TourAPI                  |
| Mypage             | 4 (summary/stamps/profile/avatar)                              | 낮     | S3 (이미지)              |
| Notification       | 5 (inbox/read/read-all/subscribe/unsubscribe)                  | 중     | web-push                 |
| Settings           | 2 (get/patch)                                                  | 낮     | —                        |
| Onboarding         | 1 (complete)                                                   | 낮     | —                        |
| TravelType Quiz    | 3 (questions/submit/me)                                        | 낮-중  | —                        |
| Ranking            | 2 (weekly/by-region)                                           | 중     | 집계 cron                |
| Weather            | 1 (current)                                                    | 낮     | 기상청 OpenAPI           |
| **합계**           | **45 endpoint**                                                |        |                          |

---

## 1. Stack 비교 — 라이브러리 매핑

| 영역         | NestJS (Node 22+)                   | Spring Boot (Java 21 / Kotlin)   |
| ------------ | ----------------------------------- | -------------------------------- |
| 언어         | TypeScript                          | Java / Kotlin                    |
| ORM          | Prisma (or TypeORM)                 | JPA(Hibernate) + QueryDSL        |
| Validation   | class-validator + class-transformer | Bean Validation (Jakarta)        |
| Auth         | Passport + JWT + cookie             | Spring Security + JWT            |
| DI           | 내장 module/provider                | Spring Bean                      |
| API doc      | @nestjs/swagger                     | springdoc-openapi                |
| Mail         | nodemailer + SES SDK                | Spring Mail + AWS SDK            |
| Push         | `web-push` (npm)                    | `nl.martijndwars:web-push`       |
| Queue        | BullMQ + Redis                      | Spring @Async / RabbitMQ / Kafka |
| Cron         | @nestjs/schedule                    | @Scheduled                       |
| Rate limit   | @nestjs/throttler + Redis           | Bucket4j + Redis                 |
| Test         | Jest + supertest                    | JUnit5 + RestAssured             |
| Image upload | multer + AWS S3 SDK                 | Spring Multipart + AWS S3 SDK    |
| External API | axios                               | WebClient (reactive)             |
| Migration    | Prisma migrate                      | Flyway / Liquibase               |

---

## 2. Phase 별 공수 비교

| Phase    | 작업                            | NestJS        | Spring Boot    |
| -------- | ------------------------------- | ------------- | -------------- |
| 1        | 인프라/공통/Swagger/테스트 셋업 | 5d            | **7d**         |
| 2        | Auth (9 ep + 메일 + rate limit) | 6d            | **8d**         |
| 3        | 핵심 도메인 11개                | 20d           | **24d**        |
| 4        | Push + cron + 큐                | 4d            | **5d**         |
| 5        | 배포/운영 (Docker/CI/Sentry)    | 5d            | **6d**         |
| 6        | FE 통합 + 버그 buffer           | 5d            | 5d             |
| **합계** |                                 | **45d (9주)** | **55d (11주)** |

**Spring Boot +10일 (~22%)** — Java 보일러플레이트 + Spring Security filter
chain + JPA 매핑. **Kotlin 사용 시 -3~5d** (data class + null safety).

### 큰 시간 먹는 항목 (양쪽 공통)

- **TourAPI 연동 + 이미지 proxy + 캐싱** (4d) — 외부 API 안정성 검증
- **Letter 매칭 알고리즘** (3d) — 본인 제외 1명 1회 전달 + 랜덤 지연 큐
- **Web Push 발송 인프라** (2d) — 큐 + 재시도 + 410 endpoint cleanup

### 인력 시나리오

| 시나리오                      | NestJS  | Spring Boot |
| ----------------------------- | ------- | ----------- |
| 숙련 1인 풀타임               | **9주** | **11주**    |
| 숙련 2인 (auth + 도메인 분담) | 5-6주   | 6-7주       |
| 주니어 포함 / 일부 외주       | 10-14주 | 12-16주     |

---

## 3. 배포 옵션 비교

### NestJS — MVP 권장 조합

```
FE: Vercel (현재)
BE: Railway 또는 Render — Docker 컨테이너 (Node ~200MB)
DB: Railway PG / Supabase / Neon
Cache: Upstash Redis (서버리스)
이미지: Cloudflare R2 (egress 무료) 또는 S3
메일: Resend (3K/월 무료 → $20/월)
Push: web-push 라이브러리
모니터링: Sentry (10K events 무료)
DNS: Cloudflare
```

**비용 월 $30-80** / 셋업 **1-2일** / Git push 배포 자동.

### Spring Boot — MVP 권장 조합

```
FE: Vercel
BE: AWS Elastic Beanstalk 또는 ECS Fargate (JVM 1GB heap)
DB: AWS RDS Postgres (Multi-AZ 옵션)
Cache: ElastiCache Redis
이미지: S3 + CloudFront
메일: AWS SES ($0.10/1K)
CI/CD: GitHub Actions → ECR → ECS
모니터링: CloudWatch + Sentry
```

**비용 월 $150-400** / 셋업 **4-7일** / 한국 기업 표준.

또는 **Railway / Render** 도 Spring Boot 가능 — 메모리 plan ↑ 필요 (heap 512MB+).
비용 $40-100.

### 배포 친화성

| 항목                   | NestJS          | Spring Boot                         |
| ---------------------- | --------------- | ----------------------------------- |
| Docker 이미지 크기     | 150-300 MB      | 250-500 MB                          |
| Cold start             | 1-3초           | 5-15초 (warm-up 필요)               |
| 메모리 (idle)          | 80-150 MB       | 300-512 MB                          |
| Cloud Run / App Runner | ◎               | △ (cold start 부담)                 |
| Serverless functions   | ◎ (Vercel 가능) | △ (Spring Native 또는 Quarkus 고려) |
| Kubernetes             | ◎               | ◎                                   |

### Growth 단계 (사용자 1만~10만)

양쪽 모두 **AWS ECS Fargate + ALB + RDS + ElastiCache** 권장. 월 $300-800.
NestJS 는 Cloud Run 도 옵션.

### Scale 단계 (사용자 10만+)

EKS / Multi-region — 이 시점에 별도 설계 (현재 over-engineering).

---

## 4. 한국 시장 / 채용 / 유지보수

| 항목                      | NestJS                    | Spring Boot                        |
| ------------------------- | ------------------------- | ---------------------------------- |
| 한국 개발자 풀            | 중 (성장 중)              | **압도적 다수**                    |
| 채용 난이도               | 시니어 어려움             | 쉬움 (주니어~시니어)               |
| 기업 도입 사례            | 토스 / 당근 / 카카오 일부 | 네이버 / 카카오 / 쿠팡 / 배민 다수 |
| 외주 / 프리랜서 풀        | 중                        | 매우 풍부                          |
| 보안 컨설팅 / KISA 가이드 | 적음                      | 풍부                               |
| 학습 자료 (한글)          | 중                        | 매우 많음                          |

---

## 5. 의사결정 — 본 프로젝트 컨텍스트

### NestJS 가 맞는 경우

- FE 가 이미 **TypeScript + Next.js** → 같은 언어 통일 ✅
- 작은 팀 (1-3인) — 풀스택 1명이 양쪽 다 가능
- 빠른 MVP / PMF 검증 우선
- Vercel + Railway 같은 모던 serverless 운영 선호
- 향후 BFF / GraphQL 도입 가능성

### Spring Boot 가 맞는 경우

- 시니어 **Java/Spring 인력** 이미 보유 또는 채용 예정
- 한국 대형 인프라 / 금융 / 공공 — 보안 / 규제 요구 ↑
- **AWS 기반 인프라** (RDS / ECS / ElastiCache) 표준
- 장기 운영 (5년+) / 유지보수 인력 확보 중요
- Batch 작업 / Domain 복잡도 ↑ (DDD/CQRS 도입 검토)

### 본 프로젝트 권장

- **풀스택 통일 + 빠른 검증** → NestJS + Railway
- **안정 / 장기 운영 + Java 인력 활용** → Spring Boot + AWS

둘 다 합리적. 팀 인력 / 운영 전략에 따라 결정.

---

## 6. ERD 초안 (entity 매핑)

도메인 11개를 11+ entity 로 매핑. 이름은 NestJS Prisma / JPA 양쪽 호환되는
camelCase 표기.

### 핵심 entity

```
User
  id (PK, uuid)
  username (unique, varchar 20)
  passwordHash (varchar 255, bcrypt/argon2)
  name (varchar 30)
  email (unique, varchar 255)
  phone (varchar 20)
  birthDate (date)
  nickname (varchar 50)
  avatarUrl (varchar 500, nullable)
  isOnboarded (boolean, default false)
  createdAt / updatedAt

UserPasswordHistory   -- 최근 N개 비번 hash (재사용 차단)
  id (PK)
  userId (FK → User)
  passwordHash (varchar 255)
  createdAt
  -- 인덱스: (userId, createdAt DESC)

PasswordResetToken
  id (PK)
  userId (FK → User)
  tokenHash (varchar 255, unique)   -- 평문 X
  expiresAt (timestamp)
  usedAt (timestamp, nullable)
  createdAt

Session / RefreshToken
  id (PK)
  userId (FK → User)
  tokenHash (varchar 255)
  userAgent (varchar 500, nullable)
  ip (varchar 45, nullable)
  expiresAt
  revokedAt (nullable)
  createdAt

TravelType
  id (PK)
  userId (FK → User, unique)        -- 1:1
  code (varchar 20)                  -- "ADVENTURER" 등
  title (varchar 50)
  description (text)
  emoji (varchar 10)
  keywords (jsonb / array)
  updatedAt

Destination                          -- TourAPI mirror + 자체 메타
  id (varchar 50, PK)                -- 예: "cheongju-attraction-1"
  name (varchar 100)
  region (varchar 30)                -- "cheongju" 등 RegionCode
  category (enum: attraction|festival|experience|local)
  imageUrl (varchar 500, nullable)
  description (text, nullable)
  address (varchar 300, nullable)
  lat / lng (double, nullable)
  eventStart / eventEnd (date, nullable)   -- festival 만
  sourceContentId (varchar 50, nullable)    -- TourAPI contentId
  syncedAt (timestamp)
  -- 인덱스: (region, category)

DestinationContent                   -- /region/[code] 상세 콘텐츠
  id (varchar 50, PK)
  region (varchar 30)
  category (enum)
  title (varchar 200)
  body (text)
  imageUrl (varchar 500, nullable)
  eventStart / eventEnd (date, nullable)
  publishedAt

Tournament                           -- 진행 기록 (랭킹 집계용)
  id (uuid PK)
  userId (FK → User)
  winnerId (FK → Destination)
  runnerUpId (FK → Destination, nullable)
  matchesPlayed (int)
  tournamentSize (int)               -- 4/8/16/32
  theme (jsonb)                      -- {kind, value}
  completedAt
  -- 인덱스: (userId, completedAt DESC), (winnerId, completedAt) — 랭킹 집계

SavedTournament                      -- 마이페이지 저장 우승지
  id (uuid PK)
  userId (FK → User)
  destinationId (FK → Destination)
  luckyColor (varchar 7)             -- "#F472B6"
  meetChance (int)                   -- 0-100
  savedAt
  -- unique (userId, destinationId)

Letter
  id (uuid PK)
  senderId (FK → User)
  recipientId (FK → User, nullable)  -- 매칭 큐 처리 후 채워짐
  body (varchar 5)                   -- 최대 5 grapheme
  locationLabel (varchar 100)
  locationRegion (varchar 30, nullable)
  locationLat / locationLng (double, nullable)
  isAnonymous (boolean)
  arrivedAt (timestamp, nullable)    -- 매칭+지연 후
  likeCount (int default 0)
  isLiked (boolean computed per recipient)
  isSaved (boolean computed per recipient)
  isRead (boolean per recipient)
  createdAt
  -- 인덱스: (recipientId, arrivedAt DESC), (senderId, createdAt DESC)
  -- 3일 후 자동 삭제 — saved=false 한정

LetterLike / LetterSave              -- 다대다 관계 분리
  letterId, userId, createdAt
  -- composite PK

Notification
  id (uuid PK)
  userId (FK → User)
  type (enum: letter.received | letter.liked | tournament.shared | event | security)
  title (varchar 100)
  body (varchar 300, nullable)
  link (varchar 500, nullable)
  imageUrl (varchar 500, nullable)
  read (boolean default false)
  createdAt
  -- 인덱스: (userId, createdAt DESC), (userId, read)

PushSubscription
  id (uuid PK)
  userId (FK → User)
  endpoint (varchar 1000, unique)
  p256dh (varchar 200)
  authSecret (varchar 100)
  lastSentAt (timestamp, nullable)
  failedAt (timestamp, nullable)     -- 410 받으면 기록 후 정리
  createdAt
  -- 인덱스: (userId)

UserSettings
  userId (PK, FK → User, 1:1)
  pushEnabled (boolean default true)
  inAppEnabled (boolean default true)
  letterReceived (boolean default true)
  letterLiked (boolean default true)
  theme (varchar 10, nullable)
  locale (varchar 5, default 'ko')
  updatedAt

QuizQuestion / QuizOption            -- TravelType 5문항
  question: id, text, order
  option:   id, questionId, text, weightCode (varchar)

TravelTypeResult                     -- 사용자 응답 + 결과
  id (uuid PK)
  userId (FK)
  answers (jsonb)
  computedCode (varchar 20)
  createdAt

Stamp                                -- 도장책 (Tournament 에서 derive 가능하지만
                                     -- 사용자 명시 visit 기록도 가능)
  userId, regionCode (composite PK)
  firstVisitedAt
```

### 집계 / cache 후보 (Materialized View 또는 Redis)

- `WeeklyRanking` — Tournament 의 winnerId 별 주간 점수 집계 (월요일 cron)
- `RegionWins` — Destination.region 별 누적 우승 수
- `LetterMatchQueue` — Redis sorted set, 발송 시각으로 정렬

### Cron / Job

- `letter:matchAndDeliver` — 매분: pending letter 매칭 + delivery time 도달 시
  `arrivedAt` 갱신 + Notification + Push 발행
- `letter:cleanup` — 매일 새벽: 3일 지난 saved=false letter 삭제
- `ranking:weeklyAggregate` — 매주 월요일 새벽: WeeklyRanking 갱신
- `push:cleanup410` — 매주: 410 endpoint 정리
- `passwordReset:cleanup` — 매시간: 만료 토큰 정리

---

## 7. 환경변수 체크리스트

### FE (`NEXT_PUBLIC_*` — 빌드 시 inline)

```
NEXT_PUBLIC_API_URL=https://api.tripbite.app
NEXT_PUBLIC_SITE_URL=https://trip-bite-mxue.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNb...
NEXT_PUBLIC_USE_MSW=false   # 운영
NEXT_PUBLIC_BLOCK_INDEXING=false
```

### BE 공통 (NestJS / Spring Boot)

```
# DB
DATABASE_URL=postgres://user:pass@host:5432/tripbite

# Redis
REDIS_URL=redis://...

# JWT
JWT_ACCESS_SECRET=<256bit random>
JWT_REFRESH_SECRET=<256bit random, access 와 다른 값>
JWT_ACCESS_TTL=900            # 15분
JWT_REFRESH_TTL=2592000       # 30일

# CORS
ALLOWED_ORIGINS=https://trip-bite-mxue.vercel.app,https://*.vercel.app

# Cookie
COOKIE_DOMAIN=.tripbite.app
COOKIE_SECURE=true
COOKIE_SAMESITE=Lax

# Mail
MAIL_PROVIDER=ses              # 또는 resend
SES_REGION=ap-northeast-2
SES_FROM=noreply@tripbite.app
# 또는 RESEND_API_KEY=re_...

# VAPID (Push)
VAPID_PUBLIC_KEY=BNb...
VAPID_PRIVATE_KEY=<secret>
VAPID_SUBJECT=mailto:contact@tripbite.app

# S3 (이미지)
S3_BUCKET=tripbite-uploads
S3_REGION=ap-northeast-2
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# 외부 API
TOUR_API_KEY=<한국관광공사 OpenAPI>
WEATHER_API_KEY=<기상청 OpenAPI>

# Sentry
SENTRY_DSN=https://...

# Rate limit
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### NestJS 전용

```
NODE_ENV=production
PORT=3000
```

### Spring Boot 전용

```
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
```

---

## 8. 첫 Sprint 권장 작업 순서

### Sprint 0 (1-2일) — 의사결정 + 셋업

1. **Stack 확정** (NestJS / Spring Boot) — 본 문서 참조
2. **DB 호스팅 확정** — Supabase / RDS / Railway PG
3. **배포 대상 확정** — Railway / Render / ECS / Elastic Beanstalk
4. **저장소 셋업** — `tripbite-api` 모노레포 or 별도 repo
5. **Swagger OpenAPI yaml 초안** — FE `orval` 가 그대로 사용 가능
6. **ERD 확정** — 본 문서 ERD 초안 검토 + 도메인 협의

### Sprint 1 (1주) — 인프라 + Auth PoC

- 프로젝트 구조, ORM 셋업, 마이그레이션
- 공통 미들웨어 (logging, error filter, CORS, helmet)
- `POST /auth/signup` + `POST /auth/login` + `POST /auth/refresh` + `GET /me`
- FE mock 끄고 (`NEXT_PUBLIC_USE_MSW=false`) 실 BE 와 통신 검증

### Sprint 2-4 (2-3주) — 핵심 도메인

- Sprint 2: Letter + Notification + Push (가장 외부 의존 많음)
- Sprint 3: Tournament + Destination/Region + TourAPI 연동
- Sprint 4: Mypage + Settings + TravelType + Ranking + 잔여

### Sprint 5 (1주) — 운영 안정화

- Sentry / 로그 / CI/CD 최종
- Load test (k6 / artillery)
- Beta 사용자 테스트

---

## 9. 의사결정 회의 어젠다 (참고)

1. Stack — NestJS vs Spring Boot
2. 인력 — 풀타임 1인 / 2인 / 외주 포함
3. 호스팅 — Railway/Render vs AWS
4. DB 호스팅 — Managed vs Self-hosted
5. 메일 — Resend (간편) vs SES (저렴)
6. TourAPI 연동 — 실시간 proxy vs 일간 sync
7. Letter 매칭 정책 — random vs 지역 기반 vs 유형 기반
8. 베타 → 정식 일정

문서는 결정 사항을 본 문서에 update 형식으로 누적.
