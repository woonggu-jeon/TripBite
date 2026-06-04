# TripBite BE — NestJS Architecture (구현 baseline)

`AUTH_FLOWS.md` / `NOTIFICATIONS.md` / `BACKEND_PLAN.md` 의 명세를 NestJS 로
실제 구현하기 위한 **초기 아키텍처**. 이 문서를 baseline 으로 코드 작성 진행.

**전제**:

- Node 22 LTS / NestJS 11+ / TypeScript 5+
- Prisma 6 (Postgres 16)
- Redis 7+ (BullMQ + rate limit + refresh token store)
- Stack 선택 근거: `BACKEND_PLAN.md` §5

---

## 1. 저장소 구조

별도 repo `tripbite-api` 권장 (FE 와 분리 배포). 모노레포로 합치면 CI/배포
복잡도 ↑.

```
tripbite-api/
├── src/
│   ├── main.ts                         # bootstrap (helmet, cors, cookies, validation)
│   ├── app.module.ts                   # root module
│   │
│   ├── common/                         # 공통 인프라 (도메인 독립)
│   │   ├── config/
│   │   │   ├── config.module.ts
│   │   │   ├── env.schema.ts           # zod 환경변수 검증
│   │   │   └── env.service.ts          # typed accessor
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts       # PrismaClient extends + lifecycle
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts        # ioredis singleton
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts         # 인터페이스
│   │   │   ├── ses-mail.service.ts     # AWS SES 구현
│   │   │   └── resend-mail.service.ts  # Resend 구현 (provider 토글)
│   │   ├── push/
│   │   │   ├── push.module.ts
│   │   │   └── push.service.ts         # web-push 발송 + 410 cleanup
│   │   ├── storage/
│   │   │   ├── storage.module.ts
│   │   │   └── s3.service.ts           # 이미지 upload (avatar 등)
│   │   ├── logger/
│   │   │   └── pino-logger.module.ts   # nestjs-pino + requestId
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts        # 표준 error code/message 변환
│   │   │   └── prisma-exception.filter.ts      # P2002 (unique) 등 매핑
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts         # snake_case → camelCase 등 (필요 시)
│   │   │   └── timeout.interceptor.ts          # 10s 기본
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts       # @CurrentUser() → req.user
│   │   │   ├── public.decorator.ts             # @Public() — guard skip
│   │   │   └── throttle-by-email.decorator.ts  # forgot-password 등
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts               # access cookie 검증
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts          # zod DTO 검증 (옵션)
│   │   ├── errors/
│   │   │   └── app-error.ts                    # AppError(code, message, status)
│   │   └── utils/
│   │       ├── mask.util.ts                    # 아이디 마스킹
│   │       └── grapheme.util.ts                # 5글자 검증 (FE 와 동일 로직)
│   │
│   ├── modules/                        # 도메인 모듈 (11개)
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── signup.dto.ts
│   │   │   │   ├── find-id.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   ├── reset-password.dto.ts
│   │   │   │   └── change-password.dto.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt-access.strategy.ts
│   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   ├── guards/
│   │   │   │   └── jwt-refresh.guard.ts
│   │   │   └── token.service.ts        # JWT sign/verify + cookie set
│   │   │
│   │   ├── user/
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts      # GET /me, GET /mypage, PATCH /me
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── letter/
│   │   │   ├── letter.module.ts
│   │   │   ├── letter.controller.ts
│   │   │   ├── letter.service.ts
│   │   │   ├── letter.repository.ts
│   │   │   ├── letter-match.service.ts # 본인 제외 1명 매칭
│   │   │   ├── letter.processor.ts     # BullMQ — delivery 큐
│   │   │   └── dto/
│   │   │
│   │   ├── tournament/
│   │   │   ├── tournament.module.ts
│   │   │   ├── tournament.controller.ts
│   │   │   ├── tournament.service.ts
│   │   │   ├── tournament.repository.ts
│   │   │   └── dto/
│   │   │
│   │   ├── destination/
│   │   │   ├── destination.module.ts
│   │   │   ├── destination.controller.ts
│   │   │   ├── destination.service.ts
│   │   │   ├── destination.repository.ts
│   │   │   ├── tour-api.service.ts     # 한국관광공사 OpenAPI 연동
│   │   │   └── dto/
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.module.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.repository.ts
│   │   │   ├── push-subscription.controller.ts
│   │   │   ├── push-subscription.service.ts
│   │   │   ├── notification.publisher.ts # 인박스+push 동시 발행 helper
│   │   │   └── dto/
│   │   │
│   │   ├── settings/
│   │   │   ├── settings.module.ts
│   │   │   ├── settings.controller.ts
│   │   │   ├── settings.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── onboarding/
│   │   │   ├── onboarding.module.ts
│   │   │   ├── onboarding.controller.ts
│   │   │   └── onboarding.service.ts
│   │   │
│   │   ├── quiz/
│   │   │   ├── quiz.module.ts
│   │   │   ├── quiz.controller.ts
│   │   │   ├── quiz.service.ts
│   │   │   ├── quiz-scoring.ts         # 답변 → 유형 매핑
│   │   │   └── dto/
│   │   │
│   │   ├── ranking/
│   │   │   ├── ranking.module.ts
│   │   │   ├── ranking.controller.ts
│   │   │   ├── ranking.service.ts
│   │   │   ├── ranking-aggregate.cron.ts
│   │   │   └── dto/
│   │   │
│   │   └── weather/
│   │       ├── weather.module.ts
│   │       ├── weather.controller.ts
│   │       └── weather.service.ts      # 기상청 OpenAPI proxy
│   │
│   ├── jobs/                           # 도메인 횡단 cron / queue
│   │   ├── jobs.module.ts
│   │   ├── letter-cleanup.cron.ts      # 3일 지난 미저장 편지 삭제
│   │   ├── push-cleanup.cron.ts        # 410 endpoint 정리
│   │   ├── password-reset-cleanup.cron.ts
│   │   └── ranking-weekly.cron.ts
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts        # @nestjs/terminus (DB/Redis ping)
│
├── prisma/
│   ├── schema.prisma                   # 단일 source of truth
│   ├── migrations/                     # 자동 생성
│   └── seed.ts                         # dev/test seed
│
├── test/
│   ├── e2e/                            # supertest + testcontainers
│   │   ├── auth.e2e-spec.ts
│   │   └── letter.e2e-spec.ts
│   └── helpers/
│       ├── test-app.ts                 # createTestingModule wrapper
│       └── test-db.ts                  # testcontainers PG/Redis
│
├── docker/
│   ├── Dockerfile                      # multi-stage build
│   └── docker-compose.yml              # dev (PG + Redis + app)
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # lint + test + build
│       └── deploy.yml                  # production deploy
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

---

## 2. NestJS 모듈 의존성 다이어그램

```
AppModule
├── ConfigModule              (env + zod 검증, global)
├── PrismaModule              (global)
├── RedisModule               (global)
├── PinoLoggerModule          (global)
├── ThrottlerModule           (Redis storage)
├── ScheduleModule            (@nestjs/schedule)
├── BullModule                (BullMQ queues — letter / push)
├── HealthModule
│
├── 도메인 모듈
│   ├── AuthModule            ── UserModule, MailModule, TokenService
│   ├── UserModule            ── PrismaModule
│   ├── LetterModule          ── UserModule, NotificationModule, PushModule, MatchService
│   ├── TournamentModule      ── DestinationModule
│   ├── DestinationModule     ── TourApiService (외부)
│   ├── NotificationModule    ── PushModule
│   ├── SettingsModule        ── UserModule
│   ├── OnboardingModule      ── UserModule
│   ├── QuizModule
│   ├── RankingModule         ── TournamentModule, BullModule
│   ├── WeatherModule         ── 외부 API only
│   └── JobsModule            ── 모든 도메인 import
│
└── 공통 모듈
    ├── MailModule            ── ConfigModule
    ├── PushModule            ── ConfigModule, NotificationModule (구독 store)
    └── StorageModule         ── ConfigModule
```

global module: ConfigModule, PrismaModule, RedisModule, PinoLoggerModule.

---

## 3. main.ts (Bootstrap)

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { EnvService } from './common/config/env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const env = app.get(EnvService);

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());
  app.enableCors({
    origin: env.allowedOrigins, // Vercel 도메인들
    credentials: true, // 쿠키 전송 필수
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO 정의 외 필드 제거
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  // Swagger — production 에선 ?key 토큰 보호 또는 비공개
  if (env.nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TripBite API')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, doc);
  }

  await app.listen(env.port, '0.0.0.0');
}
bootstrap();
```

---

## 4. 환경변수 검증 (zod)

`src/common/config/env.schema.ts`:

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  ALLOWED_ORIGINS: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim())),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900), // 15분
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2592000), // 30일

  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.coerce.boolean().default(true),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

  MAIL_PROVIDER: z.enum(['ses', 'resend']).default('resend'),
  RESEND_API_KEY: z.string().optional(),
  SES_REGION: z.string().optional(),
  MAIL_FROM: z.string().email(),

  VAPID_PUBLIC_KEY: z.string().min(80),
  VAPID_PRIVATE_KEY: z.string().min(40),
  VAPID_SUBJECT: z.string().startsWith('mailto:'),

  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),

  TOUR_API_KEY: z.string(),
  WEATHER_API_KEY: z.string(),

  SENTRY_DSN: z.string().url().optional(),

  THROTTLE_TTL: z.coerce.number().int().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().default(100),

  FE_URL: z.string().url(), // 비번 재설정 메일 링크 등
});

export type Env = z.infer<typeof envSchema>;
```

`EnvService` 가 검증된 객체를 typed accessor 로 노출.

---

## 5. Prisma Schema (전체)

`prisma/schema.prisma` — DB 전체 source of truth.

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────── User ───────────────────────────

model User {
  id           String   @id @default(uuid())
  username     String   @unique @db.VarChar(20)
  passwordHash String   @db.VarChar(255)
  name         String   @db.VarChar(30)
  email        String   @unique @db.VarChar(255)
  phone        String   @db.VarChar(20)
  birthDate    DateTime @db.Date
  nickname     String   @db.VarChar(50)
  avatarUrl    String?  @db.VarChar(500)
  isOnboarded  Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  passwordHistory   UserPasswordHistory[]
  resetTokens       PasswordResetToken[]
  sessions          Session[]
  travelType        TravelTypeResult?
  tournaments       Tournament[]
  savedTournaments  SavedTournament[]
  sentLetters       Letter[] @relation("LetterSender")
  receivedLetters   Letter[] @relation("LetterRecipient")
  notifications     Notification[]
  pushSubscriptions PushSubscription[]
  settings          UserSettings?
  stamps            Stamp[]
  letterLikes       LetterLike[]
  letterSaves       LetterSave[]

  @@index([deletedAt])
}

model UserPasswordHistory {
  id           String   @id @default(uuid())
  userId       String
  passwordHash String   @db.VarChar(255)
  createdAt    DateTime @default(now())
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  tokenHash String    @unique @db.VarChar(255)   // 평문 X — sha256
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
  @@index([expiresAt])    // cron cleanup
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique @db.VarChar(255)  // refresh token sha256
  userAgent String?  @db.VarChar(500)
  ip        String?  @db.VarChar(45)
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, expiresAt])
}

// ─────────────────────── Destination ────────────────────────

enum DestinationCategory {
  attraction
  festival
  experience
  local
}

model Destination {
  id              String    @id @db.VarChar(50)   // "cheongju-attraction-1"
  name            String    @db.VarChar(100)
  region          String    @db.VarChar(30)      // RegionCode
  category        DestinationCategory
  imageUrl        String?   @db.VarChar(500)
  description     String?   @db.Text
  address         String?   @db.VarChar(300)
  lat             Float?
  lng             Float?
  eventStart      DateTime?
  eventEnd        DateTime?
  sourceContentId String?   @db.VarChar(50)      // TourAPI contentId
  syncedAt        DateTime  @default(now())

  asWinner    Tournament[] @relation("Winner")
  asRunnerUp  Tournament[] @relation("RunnerUp")
  saved       SavedTournament[]

  @@index([region, category])
  @@index([category])
}

model DestinationContent {
  id          String   @id @db.VarChar(50)
  region      String   @db.VarChar(30)
  category    DestinationCategory
  title       String   @db.VarChar(200)
  body        String   @db.Text
  imageUrl    String?  @db.VarChar(500)
  eventStart  DateTime?
  eventEnd    DateTime?
  publishedAt DateTime @default(now())

  @@index([region])
  @@index([category, publishedAt(sort: Desc)])
}

// ─────────────────────── Tournament ─────────────────────────

model Tournament {
  id              String   @id @default(uuid())
  userId          String
  winnerId        String
  runnerUpId      String?
  matchesPlayed   Int
  tournamentSize  Int
  theme           Json     // {kind: "season" | "random", value: "spring" | ...}
  completedAt     DateTime @default(now())

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  winner    Destination  @relation("Winner", fields: [winnerId], references: [id])
  runnerUp  Destination? @relation("RunnerUp", fields: [runnerUpId], references: [id])

  @@index([userId, completedAt(sort: Desc)])
  @@index([winnerId, completedAt])   // 주간 랭킹 집계
  @@index([completedAt])              // 기간 쿼리
}

model SavedTournament {
  id            String   @id @default(uuid())
  userId        String
  destinationId String
  luckyColor    String   @db.VarChar(7)     // "#F472B6"
  meetChance    Int                          // 0-100
  savedAt       DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  destination Destination @relation(fields: [destinationId], references: [id])

  @@unique([userId, destinationId])
  @@index([userId, savedAt(sort: Desc)])
}

// ────────────────────────── Letter ──────────────────────────

model Letter {
  id              String    @id @default(uuid())
  senderId        String
  recipientId     String?                              // 매칭 후 채움
  body            String    @db.VarChar(20)            // grapheme 5자 (한글 multi-byte)
  locationLabel   String    @db.VarChar(100)
  locationRegion  String?   @db.VarChar(30)
  locationLat     Float?
  locationLng     Float?
  isAnonymous     Boolean   @default(false)
  arrivedAt       DateTime?                            // delivery 시 채움
  likeCount       Int       @default(0)
  createdAt       DateTime  @default(now())
  deletedAt       DateTime?

  sender    User           @relation("LetterSender", fields: [senderId], references: [id], onDelete: Cascade)
  recipient User?          @relation("LetterRecipient", fields: [recipientId], references: [id], onDelete: SetNull)
  likes     LetterLike[]
  saves     LetterSave[]

  @@index([recipientId, arrivedAt(sort: Desc)])
  @@index([senderId, createdAt(sort: Desc)])
  @@index([recipientId, deletedAt])
  @@index([arrivedAt, deletedAt])   // 3일 cleanup
}

model LetterLike {
  letterId  String
  userId    String
  createdAt DateTime @default(now())
  letter    Letter   @relation(fields: [letterId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([letterId, userId])
  @@index([userId, createdAt(sort: Desc)])
}

model LetterSave {
  letterId  String
  userId    String
  createdAt DateTime @default(now())
  letter    Letter   @relation(fields: [letterId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([letterId, userId])
  @@index([userId, createdAt(sort: Desc)])
}

// ──────────────────────── Notification ──────────────────────

enum NotificationType {
  letter_received
  letter_liked
  tournament_shared
  event
  security
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  type      NotificationType
  title     String           @db.VarChar(100)
  body      String?          @db.VarChar(300)
  link      String?          @db.VarChar(500)
  imageUrl  String?          @db.VarChar(500)
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, read])
}

model PushSubscription {
  id          String    @id @default(uuid())
  userId      String
  endpoint    String    @unique @db.VarChar(1000)
  p256dh      String    @db.VarChar(200)
  authSecret  String    @db.VarChar(100)
  lastSentAt  DateTime?
  failedAt    DateTime?
  createdAt   DateTime  @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ──────────────────────── Settings / Misc ───────────────────

model UserSettings {
  userId          String   @id
  pushEnabled     Boolean  @default(true)
  inAppEnabled    Boolean  @default(true)
  letterReceived  Boolean  @default(true)
  letterLiked     Boolean  @default(true)
  theme           String?  @db.VarChar(10)
  locale          String   @default("ko") @db.VarChar(5)
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────── TravelType Quiz ────────────────────

model QuizQuestion {
  id        String       @id @default(uuid())
  text      String       @db.VarChar(300)
  order     Int
  createdAt DateTime     @default(now())
  options   QuizOption[]

  @@index([order])
}

model QuizOption {
  id          String       @id @default(uuid())
  questionId  String
  text        String       @db.VarChar(200)
  weightCode  String       @db.VarChar(20)   // 유형 매핑 키
  order       Int
  question    QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId, order])
}

model TravelTypeResult {
  id            String   @id @default(uuid())
  userId        String   @unique          // 1:1
  computedCode  String   @db.VarChar(20)  // "ADVENTURER" 등
  title         String   @db.VarChar(50)
  description   String   @db.Text
  emoji         String   @db.VarChar(10)
  keywords      Json     // string[]
  answers       Json     // {questionId, optionId}[]
  updatedAt     DateTime @updatedAt
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────── Stamp ──────────────────────────

model Stamp {
  userId          String
  regionCode      String   @db.VarChar(30)
  firstVisitedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, regionCode])
  @@index([userId])
}

// ──────────────────── Ranking (집계 cache) ─────────────────

model WeeklyRanking {
  id            String   @id @default(uuid())
  weekStart     DateTime @db.Date
  destinationId String
  score         Int
  rank          Int
  computedAt    DateTime @default(now())

  @@unique([weekStart, destinationId])
  @@index([weekStart, rank])
}
```

---

## 6. Auth 구현 상세

### 6-1. Cookie 전략

- access_token: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900`
- refresh_token: `HttpOnly; Secure; SameSite=Lax; Path=/auth/refresh; Max-Age=2592000`

`token.service.ts`:

```ts
setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: this.env.cookieSecure,
    sameSite: this.env.cookieSameSite,
    domain: this.env.cookieDomain,
    path: '/',
    maxAge: this.env.jwtAccessTtl * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: this.env.cookieSecure,
    sameSite: this.env.cookieSameSite,
    domain: this.env.cookieDomain,
    path: '/auth/refresh',
    maxAge: this.env.jwtRefreshTtl * 1000,
  });
}
```

### 6-2. JWT Strategy (Passport)

`jwt-access.strategy.ts`:

```ts
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(env: EnvService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.access_token,
      ]),
      secretOrKey: env.jwtAccessSecret,
      ignoreExpiration: false,
    });
  }
  validate(payload: { sub: string }) {
    return { id: payload.sub };
  }
}
```

`JwtAuthGuard` 가 기본 (글로벌 가드). `@Public()` decorator 로 skip.

### 6-3. Refresh 흐름

- `POST /auth/refresh` — refresh cookie 검증 → DB Session 매칭 (sha256 비교) →
  새 access 발급 + (rotation) 새 refresh 발급. DB Session 의 tokenHash 갱신.
- Rotation 권장: 매번 refresh 시 token 교체 — replay 방지.

### 6-4. Login 핵심 로직 (예시)

```ts
async login(dto: LoginDto, req: Request, res: Response) {
  await this.rateLimitByIp(req.ip, 'login', 5, 60);
  const user = await this.userRepo.findByUsername(dto.username);
  // 사용자 미존재여도 동일 응답 — enum 방지
  const ok = user && (await argon2.verify(user.passwordHash, dto.password));
  if (!ok) {
    throw new AppError('AUTH_INVALID_CREDENTIALS', 401);
  }
  const accessToken = this.tokens.signAccess(user.id);
  const refreshToken = this.tokens.signRefresh(user.id);
  await this.sessionRepo.create({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt: addSeconds(new Date(), this.env.jwtRefreshTtl),
  });
  this.tokens.setAuthCookies(res, accessToken, refreshToken);
  return { success: true };
}
```

### 6-5. Forgot/Reset 흐름

```ts
async forgotPassword(dto: ForgotPasswordDto) {
  await this.rateLimitByEmail(dto.email, 'forgot-password', 3, 3600);
  await this.rateLimitByIp(currentIp, 'forgot-password', 10, 3600);

  const user = await this.userRepo.findByEmail(dto.email);
  if (user) {
    // 기존 active 토큰 무효화
    await this.resetRepo.invalidateActive(user.id);

    const token = randomBytes(32).toString('base64url');
    const tokenHash = sha256(token);
    const expiresAt = addHours(new Date(), 1);
    await this.resetRepo.create({ userId: user.id, tokenHash, expiresAt });

    await this.mail.send({
      to: user.email,
      template: 'password-reset',
      vars: {
        FE_URL: this.env.feUrl,
        TOKEN: token,
        EXPIRES_AT_KST: formatKst(expiresAt),
        USERNAME: user.username,
      },
    });

    // 보안 알림 (선택)
    await this.notificationPublisher.publish({
      userId: user.id,
      type: 'security',
      title: '비밀번호 재설정 요청',
      body: '본인이 아니라면 즉시 알려주세요.',
    });
  }
  // 무조건 204 — enum 방지
}
```

---

## 7. Letter 매칭 + 발송 (BullMQ)

### Queue 설계

- `letter-delivery` queue — 새 letter 생성 시 즉시 enqueue. 지연 15-60분 random.
- worker (`LetterProcessor`):
  1. recipient 선정 (본인 제외, 최근 받은 적 없는 user, region/유형 가중치 옵션)
  2. `letter.recipientId` 갱신 + `arrivedAt = now`
  3. NotificationPublisher.publish(`letter_received`) — 인박스 + push 동시

```ts
@Processor('letter-delivery')
export class LetterProcessor extends WorkerHost {
  async process(job: Job<{ letterId: string }>) {
    const letter = await this.letterRepo.find(job.data.letterId);
    if (!letter || letter.recipientId) return;

    const recipient = await this.matchService.findRecipient(letter.senderId);
    if (!recipient) {
      // 매칭 실패 — 5분 후 retry
      throw new Error('no-recipient');
    }
    await this.letterRepo.deliver(letter.id, recipient.id);
    await this.notificationPublisher.publish({
      userId: recipient.id,
      type: 'letter_received',
      title: '편지가 도착했어요',
      body: letter.isAnonymous
        ? '익명의 누군가가 5글자를 보냈어요'
        : `${letter.sender.nickname}님이 5글자를 보냈어요`,
      link: `/letter/${letter.id}`,
    });
  }
}
```

Job options:

```ts
queue.add(
  'deliver',
  { letterId },
  {
    delay: 1000 * 60 * (15 + Math.floor(Math.random() * 46)), // 15-60분
    attempts: 5,
    backoff: { type: 'exponential', delay: 60_000 },
  },
);
```

---

## 8. Notification Publisher (인박스 + push 동시 발행)

```ts
@Injectable()
export class NotificationPublisher {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
  ) {}

  async publish(input: PublishInput) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId: input.userId },
    });
    const cat = mapTypeToCategory(input.type); // letter_received → letterReceived
    if (cat && settings && !settings[cat]) return; // 카테고리 off → 둘 다 skip

    // 인박스
    if (!settings || settings.inAppEnabled) {
      await this.prisma.notification.create({
        data: { ...input, read: false },
      });
    }

    // Push
    if (!settings || settings.pushEnabled) {
      await this.push.sendToUser(input.userId, {
        title: input.title,
        body: input.body,
        link: input.link,
        tag: input.tag,
      });
    }
  }
}
```

`push.service.ts` 가 user 의 모든 active PushSubscription 에 발송 + 410 응답 시
DB 삭제.

---

## 9. 표준 에러 처리

`common/errors/app-error.ts`:

```ts
export class AppError extends Error {
  constructor(
    public readonly code: string, // SCREAMING_SNAKE_CASE
    public readonly status: number,
    public readonly message: string = code,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}
```

`http-exception.filter.ts`:

```ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (err instanceof AppError) {
      return res.status(err.status).json({
        code: err.code,
        message: err.message,
        details: err.details,
      });
    }
    if (err instanceof HttpException) {
      const status = err.getStatus();
      const body = err.getResponse();
      return res.status(status).json({
        code: defaultCodeForStatus(status),
        message: typeof body === 'string' ? body : (body as any).message,
      });
    }
    // 알 수 없는 에러 — Sentry 발송 + 500
    Sentry.captureException(err);
    return res.status(500).json({ code: 'INTERNAL', message: 'Server error' });
  }
}
```

`prisma-exception.filter.ts` 가 P2002 (unique) → 409 / P2025 (not found) → 404 등 매핑.

---

## 10. Rate Limit (Redis)

```ts
@Injectable()
export class RateLimitService {
  constructor(private redis: RedisService) {}

  async hit(key: string, limit: number, ttlSec: number) {
    const count = await this.redis.incr(`rate:${key}`);
    if (count === 1) await this.redis.expire(`rate:${key}`, ttlSec);
    if (count > limit) throw new AppError('RATE_LIMIT', 429);
  }
}
```

Auth 흐름 별 정책:

- `login:ip:{ip}` — 5회 / 분
- `forgot-password:email:{hash(email)}` — 3회 / 시간
- `forgot-password:ip:{ip}` — 10회 / 시간
- `find-id:ip:{ip}` — 5회 / 시간

@nestjs/throttler 의 `ThrottlerModule.forRootAsync` 로 storage 를 Redis 로
교체 (`@nest-lab/throttler-storage-redis`).

---

## 11. Cron Jobs

`@nestjs/schedule` 사용. 단일 인스턴스 보장은 Redis 락 (BullMQ 의 `repeatable` 또는
`bull-board` 사용).

```ts
@Injectable()
export class LetterCleanupCron {
  @Cron('0 4 * * *') // 매일 새벽 4시
  async cleanupExpiredLetters() {
    const threshold = subDays(new Date(), 3);
    await this.prisma.letter.updateMany({
      where: {
        arrivedAt: { lt: threshold },
        deletedAt: null,
        saves: { none: {} }, // 저장된 것은 보존
      },
      data: { deletedAt: new Date() },
    });
  }
}
```

- `letter-cleanup`: 매일 04:00 — 3일 지난 미저장 편지 soft delete
- `push-cleanup`: 매주 일요일 — 90일 미사용 endpoint 정리
- `password-reset-cleanup`: 매시간 — 만료 토큰 삭제
- `ranking-weekly`: 매주 월요일 03:00 — Tournament → WeeklyRanking 집계
- `session-cleanup`: 매일 — 만료 Session 삭제

---

## 12. Docker / docker-compose

`docker/Dockerfile`:

```dockerfile
# === build stage ===
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# === runtime stage ===
FROM node:22-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

`docker/docker-compose.yml` (개발용):

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tripbite
      POSTGRES_PASSWORD: tripbite
      POSTGRES_DB: tripbite
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  app:
    build: ..
    env_file: ../.env
    depends_on: [db, redis]
    ports: ['3000:3000']

volumes:
  pgdata:
```

---

## 13. CI/CD (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      - run: npm run build
```

`deploy.yml` (Railway 예시):

```yaml
- uses: railwayapp/cli@v3
  with:
    token: ${{ secrets.RAILWAY_TOKEN }}
- run: railway up --service tripbite-api
```

---

## 14. 테스트 전략

- **Unit**: Service 레벨 — repository mock. Jest + ts-jest.
- **Integration**: testcontainers 로 실 PG/Redis 띄움. Controller → DB end-to-end.
- **E2E**: supertest + 실 NestApplication. 인증 cookie 시뮬 (helper).

```ts
// test/helpers/test-app.ts
export async function createTestApp() {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
```

target coverage: service 80%+, controller 60%+, repository 50%+.

---

## 15. 관측성

- **Logger**: `nestjs-pino` — JSON, requestId, userId 자동 주입
- **Sentry**: `@sentry/node` + `setupNestErrorHandler`
- **Health**: `/v1/health` (DB + Redis ping) — Railway/ECS liveness probe
- **Metrics** (선택): `prom-client` `/metrics`

---

## 16. FE 와 매칭 검증

FE 의 mock (`src/mocks/handlers.ts`) 과 1:1 비교 — 응답 shape, status code,
헤더, 쿠키 동작 모두 일치해야 함.

검증 방법:

1. BE 로컬 실행 (`docker compose up`)
2. FE 의 `.env.local` 에 `NEXT_PUBLIC_USE_MSW=false` + `NEXT_PUBLIC_API_URL=http://localhost:3000/v1`
3. FE 의 e2e 테스트 (`playwright test`) 그대로 실행 — 통과 시 매칭 OK

`AUTH_FLOWS.md` + `NOTIFICATIONS.md` 의 테스트 체크리스트가 곧 BE 의 통합 테스트.

---

## 17. 구현 진행 순서 (체크리스트)

### Week 1 — 인프라

- [ ] 저장소 생성 + 디렉터리 골격
- [ ] Prisma schema 작성 + `migrate dev`
- [ ] ConfigModule + zod env 검증
- [ ] Prisma/Redis/Logger 글로벌 모듈
- [ ] Global ExceptionFilter + ValidationPipe
- [ ] Swagger 셋업
- [ ] Docker / docker-compose
- [ ] CI 파이프라인 통과
- [ ] Health check

### Week 2 — Auth

- [ ] `POST /auth/signup` (+ argon2)
- [ ] `POST /auth/login` (+ Session 생성)
- [ ] `POST /auth/refresh` (+ rotation)
- [ ] `GET /me` (JwtAuthGuard 글로벌)
- [ ] `POST /auth/logout` (Session 무효화)
- [ ] `POST /auth/find-id` (마스킹)
- [ ] `POST /auth/forgot-password` (+ Resend 메일 + rate limit)
- [ ] `POST /auth/reset-password` (+ 1회용 + history 비교)
- [ ] `POST /me/change-password`
- [ ] E2E spec 통과

### Week 3-4 — 핵심 도메인

- [ ] User / Mypage (avatar upload)
- [ ] Letter (compose + match queue + delivery)
- [ ] Notification (inbox + publisher)
- [ ] Push (subscribe / 발송 / 410 cleanup)
- [ ] Tournament + SavedTournament
- [ ] Destination + TourAPI sync
- [ ] Quiz + TravelTypeResult
- [ ] Settings
- [ ] Ranking + 주간 cron
- [ ] Onboarding
- [ ] Weather

### Week 5 — 운영

- [ ] FE 통합 테스트 (e2e 매칭)
- [ ] Sentry / Logger 운영 설정
- [ ] Load test (k6)
- [ ] Staging 배포
- [ ] Production 배포 — Railway / Render / AWS

각 항목 완료 시 본 문서 또는 별도 `IMPLEMENTATION_STATUS.md` 에 체크.

---

## 18. 참고 — 외부 라이브러리 버전 권장

```json
{
  "dependencies": {
    "@nestjs/common": "^11",
    "@nestjs/core": "^11",
    "@nestjs/platform-express": "^11",
    "@nestjs/config": "^4",
    "@nestjs/swagger": "^8",
    "@nestjs/schedule": "^5",
    "@nestjs/bullmq": "^11",
    "@nestjs/throttler": "^6",
    "@nestjs/terminus": "^11",
    "@prisma/client": "^6",
    "passport": "^0.7",
    "passport-jwt": "^4",
    "@nestjs/passport": "^11",
    "@nestjs/jwt": "^11",
    "argon2": "^0.41",
    "cookie-parser": "^1.4",
    "helmet": "^8",
    "compression": "^1.8",
    "class-validator": "^0.14",
    "class-transformer": "^0.5",
    "zod": "^3",
    "ioredis": "^5",
    "bullmq": "^5",
    "nestjs-pino": "^4",
    "pino-pretty": "^11",
    "@aws-sdk/client-s3": "^3",
    "@aws-sdk/client-ses": "^3",
    "resend": "^4",
    "web-push": "^3",
    "axios": "^1.7",
    "date-fns": "^4",
    "date-fns-tz": "^3",
    "@sentry/node": "^9"
  },
  "devDependencies": {
    "prisma": "^6",
    "@nestjs/cli": "^11",
    "@nestjs/testing": "^11",
    "jest": "^30",
    "ts-jest": "^29",
    "supertest": "^7",
    "@testcontainers/postgresql": "^10",
    "@testcontainers/redis": "^10"
  }
}
```

---

이 문서는 **구현 중 갱신** — schema 변경, 새 endpoint 추가, 결정 사항 누적
모두 본 문서 또는 `IMPLEMENTATION_STATUS.md` 에 반영.
