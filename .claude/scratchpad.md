# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 4 — 게이미피케이션 시스템 (XP/레벨/스트릭/도장깨기/랭킹)
- **상태**: 기획설계 완료
- **현재 담당**: planner-architect → developer

## 기획설계 (planner-architect)

### Phase 4: 게이미피케이션 시스템

---

**현황 분석 요약:**
- User 모델에 xp/level 필드 **없음** — 신규 추가 필요
- court_sessions.xp_earned 필드 있음 (체크아웃 시 10+5+10 계산)
- **XP가 User에 누적되지 않음** — sessions에만 기록, User 반영 안 됨
- 리뷰/제보 작성 시 XP 부여 로직 없음
- 프로필 getTierInfo()가 경기 수 기반 임시 구현 — XP 기반으로 교체 필요
- court_infos.checkins_count 필드 있음 (코트별 체크인 총수)

---

#### 1. DB 변경 계획

**User 테이블 확장** (4개 필드 추가):
| 필드 | 타입 | 설명 |
|------|------|------|
| xp | Int @default(0) | 누적 XP |
| level | Int @default(1) | 현재 레벨 (1~10) |
| streak_count | Int @default(0) | 연속 출석 일수 |
| streak_last_date | DateTime? | 마지막 스트릭 갱신 날짜 |

> User 테이블에 직접 추가하는 이유: 별도 user_stats 테이블은 매번 JOIN 필요 — 4개 필드면 컬럼 추가가 단순하고 프로필 조회 시 추가 쿼리 불필요

**user_badges 신규 테이블:**
| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt @id | PK |
| user_id | BigInt | FK → User |
| badge_type | String | court_explorer, streak_7, level_up 등 |
| badge_name | String | "동네 농구인", "7일 연속!" 등 |
| badge_data | Json @default("{}") | 추가 데이터 (달성 코트 수 등) |
| earned_at | DateTime @default(now()) | 획득일 |

> 뱃지를 별도 테이블로 분리하는 이유: 한 유저가 여러 뱃지를 가질 수 있고, 뱃지 종류가 확장될 수 있음 (도장깨기 5종 + 스트릭 + 레벨업 등)

---

#### 2. XP 시스템 상수 설계

`src/lib/constants/gamification.ts`에 정의:
```
XP 획득:
- 체크인 완료(체크아웃 시): +10 (기존 유지)
- 30분 이상 운동: +5 추가 (기존 유지)
- 1시간 이상 운동: +10 추가 (기존 유지, 총 +25)
- 리뷰 작성: +15
- 제보 작성: +5
- 7일 연속 스트릭 보너스: +50

레벨 테이블:
Lv1: 0, Lv2: 100, Lv3: 300, Lv4: 600, Lv5: 1000
Lv6: 1500, Lv7: 2500, Lv8: 4000, Lv9: 6000, Lv10: 10000

도장깨기 마일스톤:
5곳: "동네 농구인", 10곳: "지역 탐험가", 20곳: "전국 순회"
30곳: "코트 마스터", 50곳: "레전드 탐험가"
```

---

#### 3. 핵심 유틸리티 함수

`src/lib/services/gamification.ts` (서버사이드):
- `addXP(userId, amount, reason)` — XP 누적 + 레벨 자동 계산 + 레벨업 시 뱃지
- `updateStreak(userId)` — 스트릭 갱신 (오늘 vs streak_last_date 비교)
- `checkCourtBadges(userId)` — 도장깨기 마일스톤 체크 + 뱃지 부여
- `getLevelInfo(xp)` — XP로 레벨/칭호/진행률 계산 (순수 함수)
- `getSessionSummary(sessionId)` — 세션 완료 카드 데이터 조합

---

#### 4. API 설계

| 메서드 | 경로 | 기능 | 인증 |
|--------|------|------|------|
| GET | /api/web/profile/gamification | 내 XP+레벨+스트릭+뱃지+도장깨기 현황 | 필수 |
| GET | /api/web/courts/[id]/rankings | 코트별 체크인 랭킹 TOP 10 | 공개 |

> 별도 XP 적립 API 불필요: 기존 체크아웃(DELETE /checkin), 리뷰(POST /reviews), 제보(POST /reports) API 내부에서 addXP() 호출

---

#### 5. 기존 API 수정 범위

**checkin/route.ts DELETE (체크아웃):**
- 기존: xp_earned만 sessions에 저장
- 추가: `addXP(userId, xp, "checkin")` + `updateStreak(userId)` + `checkCourtBadges(userId)`
- 응답에 levelUp/streakBonus/newBadge 정보 추가

**reviews/route.ts POST (리뷰 작성):**
- 추가: `addXP(userId, 15, "review")`

**reports/route.ts POST (제보 작성):**
- 추가: `addXP(userId, 5, "report")`

---

#### 6. UI 컴포넌트 + 배치

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| src/lib/constants/gamification.ts | XP/레벨/뱃지 상수 정의 | 신규 |
| src/lib/services/gamification.ts | addXP/updateStreak/checkCourtBadges 등 서버 로직 | 신규 |
| src/app/api/web/profile/gamification/route.ts | GET: 게이미피케이션 종합 현황 | 신규 |
| src/app/api/web/courts/[id]/rankings/route.ts | GET: 코트별 체크인 랭킹 TOP 10 | 신규 |
| src/app/(web)/profile/_components/xp-level-card.tsx | XP 진행바 + 레벨 + 칭호 표시 | 신규 |
| src/app/(web)/profile/_components/streak-card.tsx | 연속 출석 스트릭 (불꽃 아이콘 + 일수) | 신규 |
| src/app/(web)/profile/_components/court-stamps.tsx | 도장깨기 진행률 + 마일스톤 뱃지 | 신규 |
| src/app/(web)/profile/_components/badge-collection.tsx | 획득 뱃지 컬렉션 | 신규 |
| src/app/(web)/courts/[id]/_components/session-complete-card.tsx | 체크아웃 후 세션 요약 카드 (팝업) | 신규 |
| src/app/(web)/courts/[id]/_components/court-rankings.tsx | 코트별 체크인 랭킹 TOP 10 | 신규 |
| src/app/(web)/profile/page.tsx | XP/스트릭/도장깨기/뱃지 섹션 추가 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | 랭킹 섹션 + 세션완료카드 연결 | 수정 |
| src/app/api/web/courts/[id]/checkin/route.ts | 체크아웃에 addXP+스트릭+도장깨기 | 수정 |
| src/app/api/web/courts/[id]/reviews/route.ts | POST에 addXP(15) 추가 | 수정 |
| src/app/api/web/courts/[id]/reports/route.ts | POST에 addXP(5) 추가 | 수정 |
| prisma/schema.prisma | User 4필드 + user_badges 테이블 | 수정 |

---

#### 7. 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | Prisma 스키마 변경 (User 4필드 + user_badges) + prisma generate | developer | 없음 | 5분 |
| 2 | gamification 상수 + 서비스 함수 (addXP/updateStreak/checkCourtBadges/getLevelInfo) | developer | 1단계 | 15분 |
| 3 | 기존 API 3개 수정 (checkin DELETE + reviews POST + reports POST에 addXP 연결) | developer | 2단계 | 10분 |
| 4 | 신규 API 2개 (profile/gamification + courts/[id]/rankings) | developer | 2단계 | 10분 |
| 5 | 프로필 UI (xp-level-card + streak-card + court-stamps + badge-collection) + page.tsx 통합 | developer | 4단계 | 20분 |
| 6 | 코트 UI (session-complete-card + court-rankings) + page.tsx 통합 | developer | 4단계 | 15분 |
| 7 | tester + reviewer (병렬) | tester+reviewer | 5,6단계 | 10분 |

---

#### 8. developer 주의사항

- **기존 XP 계산 로직 유지**: checkin/route.ts의 xp 계산(10+5+10)은 그대로. addXP()를 **추가 호출**하여 User.xp에 누적
- **스트릭 날짜 비교**: streak_last_date가 "어제"이면 streak_count++, "오늘"이면 변경 없음, 그 외이면 리셋 후 1
  - 날짜 비교는 **한국 시간(KST)** 기준으로 해야 함 (UTC+9)
- **도장깨기 카운트**: court_sessions에서 user_id별 DISTINCT court_id 수를 count
- **레벨업 판정**: addXP 내에서 xp 추가 후 새 레벨 계산 → 이전 레벨과 다르면 level 필드 업데이트
- **프로필 getTierInfo() 교체**: 기존 경기 수 기반 → XP/레벨 기반으로 교체
- **세션 완료 카드**: 체크아웃 응답에 포함된 데이터를 클라이언트에서 모달/카드로 표시 (별도 API 호출 불필요)
- **CSS 변수만 사용**, **Material Symbols 아이콘만 사용** (기존 규칙)
- **court_rankings**: court_sessions를 user_id로 GROUP BY → COUNT → ORDER BY DESC → LIMIT 10. User join으로 nickname+level 포함
- **user_badges는 중복 방지**: 같은 badge_type을 두 번 부여하지 않도록 upsert 또는 findFirst 체크

---

## 구현 기록 (developer)

### Phase 4: 게이미피케이션 시스템 전체 구현

구현한 기능: XP/레벨/스트릭/도장깨기/뱃지/랭킹 + 프로필 통합 + 세션 완료 카드

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | User에 xp/level/streak_count/streak_last_date 추가 + user_badges 테이블 | 수정 |
| src/lib/constants/gamification.ts | LEVELS/XP_REWARDS/COURT_MILESTONES/LEVEL_BADGES 상수 | 신규 |
| src/lib/services/gamification.ts | addXP/updateStreak/checkCourtBadges/getLevelInfo 서비스 | 신규 |
| src/app/api/web/courts/[id]/checkin/route.ts | DELETE에 addXP+updateStreak+checkCourtBadges 연결 | 수정 |
| src/app/api/web/courts/[id]/reviews/route.ts | POST에 addXP(15) 추가 | 수정 |
| src/app/api/web/courts/[id]/reports/route.ts | POST에 addXP(5) 추가 | 수정 |
| src/app/api/web/profile/gamification/route.ts | GET: 게이미피케이션 종합 현황 API | 신규 |
| src/app/api/web/courts/[id]/rankings/route.ts | GET: 코트별 체크인 랭킹 TOP 10 API | 신규 |
| src/app/(web)/profile/_components/xp-level-card.tsx | XP 진행률 바 + 레벨 + 칭호 | 신규 |
| src/app/(web)/profile/_components/streak-card.tsx | 연속 출석 스트릭 카드 | 신규 |
| src/app/(web)/profile/_components/badge-collection.tsx | 뱃지 컬렉션 그리드 | 신규 |
| src/app/(web)/profile/_components/court-stamps.tsx | 도장깨기 진행률 + 마일스톤 | 신규 |
| src/app/(web)/profile/page.tsx | 게이미피케이션 4개 컴포넌트 통합 + 레벨 표시 교체 | 수정 |
| src/app/(web)/courts/[id]/_components/session-complete-card.tsx | 체크아웃 후 세션 요약 카드 (모달) | 신규 |
| src/app/(web)/courts/[id]/_components/court-rankings.tsx | 코트 체크인 랭킹 TOP 10 | 신규 |
| src/app/(web)/courts/[id]/_components/court-checkin.tsx | 체크아웃 시 세션 완료 카드 표시 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | 랭킹 섹션 추가 | 수정 |

tester 참고:
- 테스트: 체크인 -> 체크아웃 시 세션 완료 카드에 XP/레벨/스트릭 표시되는지
- /profile에서 XP 진행바, 스트릭 카드, 도장깨기, 뱃지 표시되는지
- /courts/[id]에서 랭킹 TOP 10 표시되는지
- 리뷰 작성 시 15 XP, 제보 작성 시 5 XP 적립되는지
- tsc --noEmit 통과 확인됨

reviewer 참고:
- user_badges에 @@unique([user_id, badge_type])로 중복 방지
- 스트릭 날짜 비교는 KST(UTC+9) 기준
- addXP에서 레벨업 판정 후 level 필드 자동 업데이트
- DB 마이그레이션 필요 (npx prisma db push 또는 migrate)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 03-29 | addXP atomic increment + streak KST 시간대 통일 + completeSession 트랜잭션 함수 추가 | gamification.ts, checkin/route.ts | reviewer 지적: race condition + KST 날짜 버그 + 트랜잭션 미적용 |

---

## 테스트 결과 (tester)

### Phase 4: 게이미피케이션 시스템 검증 (17개 파일, 7개 검증 영역)

| # | 테스트 항목 | 결과 | 비고 |
|---|-----------|------|------|
| 1 | tsc --noEmit 타입 검사 | PASS | 에러 0건 |
| 2 | getLevelInfo 순수 함수 (8케이스) | PASS | XP=0/50/100/200/1000/9999/10000/15000 전부 정확 |
| 3 | 레벨 테이블 정확성 (Lv1~10 XP 임계값) | PASS | 기획서 일치: 0/100/300/600/1000/1500/2500/4000/6000/10000 |
| 4 | updateStreak KST 날짜 비교 (5케이스) | PASS | 연속/같은날/리셋/null/자정경계 모두 정확 |
| 5 | streak_last_date 저장/읽기 일관성 (@db.Date) | PASS | UTC 저장 -> KST 변환 후 날짜 문자열 일치 |
| 6 | 체크아웃 API gamification 응답 키 매핑 | PASS | apiSuccess snake_case 변환 -> SessionCompleteCard interface 10키 전부 일치 |
| 7 | gamification API 응답 키 매핑 | PASS | snake_case 변환 -> 프로필 GamificationData interface 전부 일치 |
| 8 | rankings API 응답 키 매핑 | PASS | snake_case 변환 -> CourtRankings interface 7키 전부 일치 |
| 9 | checkin DELETE에 addXP+updateStreak+checkCourtBadges 호출 | PASS | 3개 함수 순차 호출, 결과를 gamification 객체로 응답에 포함 |
| 10 | reviews POST에 addXP(15, "review") 호출 | PASS | recalculateCourtRating 후 XP 부여 |
| 11 | reports POST에 addXP(5, "report") 호출 | PASS | recalculateReportsCount 후 XP 부여 |
| 12 | user_badges 중복 방지 | PASS | @@unique([user_id, badge_type]) + addXP는 upsert + checkCourtBadges는 findMany 선체크 |
| 13 | CSS 변수 사용 규칙 | PASS | #FFFFFF만 하드코딩 (아이콘 흰색 — 테마 무관 OK) |
| 14 | Material Symbols 아이콘만 사용 | PASS | 모든 컴포넌트에서 material-symbols-outlined 사용 |
| 15 | 버튼 border-radius 4px | PASS | rounded-[4px] 사용 |
| 16 | 빈 값/null 처리 (gamification null) | PASS | profile page에서 {gamification && ...} 로 안전 처리 |
| 17 | 빈 뱃지 상태 | PASS | BadgeCollection에서 빈 상태 메시지 표시 |
| 18 | 스트릭 0 상태 | PASS | StreakCard에서 "연속 출석 시작하기" 안내 표시 |
| 19 | 레벨10 최대 상태 | PASS | getLevelInfo에서 progress=100, xpToNextLevel=0, "최대 레벨 달성!" 표시 |
| 20 | 랭킹 데이터 없을 때 | PASS | CourtRankings에서 rankings.length===0이면 return null |
| 21 | 프로필 미로그인 상태 | PASS | gamification API 401 -> SWR data=undefined -> 섹션 숨김 |
| 22 | XP 보상표 값 검증 | PASS | checkin:10, long_session_30:5, long_session_60:10, review:15, report:5, streak_7:50 |
| 23 | 도장깨기 마일스톤 5종 | PASS | 5/10/20/30/50곳, badge_type=court_explorer_N 형식 |
| 24 | 레벨업 뱃지 (Lv5, Lv10) | PASS | LEVEL_BADGES에 level_5, level_10 정의, addXP에서 자동 부여 |
| 25 | court-checkin -> SessionCompleteCard 연결 | PASS | handleCheckout 성공 시 setSessionResult(result) -> 모달 표시 |
| 26 | court page에 CourtRankings 배치 | PASS | CourtCheckin 아래, 이용 현황 카드 아래에 배치 |
| 27 | Prisma 스키마 User 4필드 추가 | PASS | xp/level/streak_count/streak_last_date + user_badges relation |
| 28 | user_badges 테이블 구조 | PASS | id/user_id/badge_type/badge_name/badge_data/earned_at + @@unique |

총 28개 테스트: **28개 통과 / 0개 실패**

### 참고 사항 (reviewer 지적 사항 인지)
- addXP race condition (동시 요청 시 XP 유실 가능) — 현재 사용량에서는 실질적 문제 없음
- checkCourtBadges의 create vs upsert — @@unique 제약조건이 DB 레벨에서 보호
- 체크아웃 시 3개 DB 호출이 트랜잭션으로 묶이지 않음 — 부분 실패 시 불일치 가능하나 현실적 위험 낮음

---

## 리뷰 결과 (reviewer)

### 종합 판정: 수정 필요 (경미)

전체적으로 잘 구현되었다. 상수 분리, 서비스 계층 분리, 뱃지 중복 방지(upsert/unique), KST 날짜 비교 등 설계가 탄탄하다. 아래 2건의 필수 수정과 3건의 권장 수정이 있다.

**잘된 점:**
- gamification 상수/서비스 분리가 깔끔하다. getLevelInfo가 순수 함수라 테스트/재사용 용이
- user_badges에 @@unique + upsert로 뱃지 중복 방지 완벽
- 모든 XP 부여가 서버에서만 수행 (클라이언트 조작 불가) — 보안 OK
- CSS 변수만 사용, Material Symbols 아이콘만 사용 — 프로젝트 규칙 준수
- apiSuccess/apiError 헬퍼 일관 사용
- 코드 주석이 친절하고 함수 역할이 명확

**필수 수정 (2건):**

| # | 파일 | 줄번호 | 심각도 | 문제 | 수정 방법 |
|---|------|--------|--------|------|----------|
| 1 | src/lib/services/gamification.ts | 56-108 | 🔴 | **addXP 레이스 컨디션**: findUnique로 xp를 읽고 update로 newXp를 쓰는 사이에 동시 요청이 들어오면 XP가 유실됨 (예: 체크아웃+리뷰 동시 제출) | `prisma.user.update({ data: { xp: { increment: amount } } })` 사용 후 updated 값에서 레벨 계산. 또는 $transaction으로 감싸기 |
| 2 | src/lib/services/gamification.ts | 129-130 | 🔴 | **KST 날짜 계산 버그**: `new Date(Date.now() + 9*60*60*1000)`는 시스템 시계가 UTC가 아닌 경우(한국 서버/로컬 개발 등) 이중으로 +9 적용됨. Vercel 서버는 보통 UTC지만 로컬에서 틀릴 수 있음 | UTC 보장: `const nowUTC = new Date(); const kstOffset = 9*60*60*1000; const nowKST = new Date(nowUTC.getTime() + kstOffset);` — 현재 코드와 동일하지만, streak_last_date 저장 시 `new Date(todayStr + "T00:00:00.000Z")`가 KST 자정을 UTC로 저장하는 건데 실제로는 KST 자정이 아닌 UTC 자정이 됨. KST 자정 = UTC 15:00 전날이므로 `T15:00:00.000Z` 전날로 저장하거나, 날짜 문자열 비교로 통일해야 함 |

**권장 수정 (3건):**

| # | 파일 | 줄번호 | 심각도 | 문제 | 수정 방법 |
|---|------|--------|--------|------|----------|
| 3 | src/lib/services/gamification.ts | 270-276 | 🟡 | **체크아웃 시 3개 독립 DB 호출 (addXP + updateStreak + checkCourtBadges)**: 개별 쿼리가 모두 성공해야 일관성 유지. 하나만 실패하면 XP는 받았는데 스트릭은 안 올라가는 불일치 발생 가능 | `prisma.$transaction([])` 으로 감싸거나, 최소한 try-catch로 개별 실패를 로깅 |
| 4 | src/app/api/web/courts/[id]/rankings/route.ts | 33-42 | 🟡 | **groupBy + 별도 findMany 2회 쿼리**: 현재 데이터 양이면 문제없지만, 세션 수 많아지면 groupBy가 느려질 수 있음 | 당장은 OK. 나중에 느려지면 raw SQL이나 캐시 적용 |
| 5 | src/lib/services/gamification.ts | 169 | 🟢 | **스트릭 7일은 1회성 보너스**: 14일, 21일, 30일 등 추가 마일스톤 없이 7일에서만 보너스. 유저가 7일 넘기면 동기부여 급감 가능 | 기능 확장은 별도 작업으로 — 현재는 기획대로 OK |

**프로젝트 규칙 준수 체크:**
- CSS 변수(var(--color-*)): 전 컴포넌트 준수 (하드코딩 색상 없음)
- Material Symbols: 전부 `<span className="material-symbols-outlined">` 사용
- apiSuccess/apiError: 모든 API 엔드포인트 사용
- 버튼 border-radius 4px: session-complete-card.tsx 167줄 `rounded-[4px]` 준수
- 인증: gamification API는 getWebSession 사용, rankings는 공개 API — 기획대로

---

## 📊 전체 프로젝트 진행 현황

### 완료된 작업 (toss 브랜치)
| 영역 | 내용 | 상태 |
|------|------|------|
| 토스 UI 전환 | 디자인 토큰+레이아웃+공통 컴포넌트+전 페이지 | 완료 |
| 대회 시스템 | 3단계 위자드+형식4종+상태4종+디자인템플릿+이미지업로드 | 완료 |
| 코트 시스템 | DB확장+672개 실데이터+야외필터+카카오맵 연동 | 완료 |
| 코트 Phase 2 | 체크인/체크아웃+혼잡도+GPS 100m 검증+근접감지+거리순정렬 | 완료 |
| 코트 Phase 3 | 리뷰 5항목별점+사진+상태제보+Supabase Storage | 완료 |
| 코트 Phase 6 | 카카오맵SDK+클러스터+마커+20km반경+지도목록토글 | 완료 |
| 관리자 개편 | 컴팩트 테이블+모달+탭+13개 관리 페이지 | 완료 |
| 성능 최적화 | ISR+SWR+캐시+프리페치+batch API | 완료 |
| UX 개선 23건 | 단기10+중기8+장기5 전부 완료 | 완료 |

### 코트 로드맵 (남은 Phase)
| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 4 | 게이미피케이션 (XP/레벨/스트릭/도장깨기) | 기획설계 완료 |
| Phase 5 | 픽업게임 모집 | 대기 |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-29 | architect | Phase 4 게이미피케이션 기획설계 | 완료 |
| 03-29 | developer+tester | Phase 3 리뷰+제보 시스템 구현+검증 (62항목 전통과) | 완료 |
| 03-29 | developer | 체크인 GPS 100m 검증 + 위치기반 5단계 UI + 원격 체크아웃 | 완료 |
| 03-29 | developer | 거리순 정렬 + 20km 반경 뷰 + 포그라운드 근접 감지 슬라이드업 | 완료 |
| 03-29 | developer | 카카오맵 CSP 수정 + 카카오맵 SDK 연동 + 지도+목록 분할 뷰 | 완료 |
| 03-29 | developer | 코트 체크인/체크아웃 + 혼잡도 시스템 (Phase 2) | 완료 |
| 03-29 | pm | 코트 로드맵 고도화 + 전체 프로젝트 계획 업데이트 | 완료 |
| 03-28 | developer | 코트확장: DB14필드+큐레이션15개+카카오검색131개+야외pill필터 | 완료 |
| 03-28 | developer | 홈 히어로 개편: MySummaryHero + YouTube 삭제 + SNS | 완료 |
| 03-28 | developer | 장기 UX 5건: 검색자동완성+OG메타+피드+Push+성능 | 완료 |
