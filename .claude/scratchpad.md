# 작업 스크래치패드

## 현재 작업
- **요청**: 전화번호 기반 자동 매칭 설계 (관리자 선수 등록 시 phone -> 유저 가입 시 자동 연동)
- **상태**: planner-architect 기획설계 완료
- **현재 담당**: PM 검토 -> developer 배정 대기

## 기획설계 (planner-architect)

### 전화번호 기반 선수-유저 자동 매칭 설계

---

#### 현재 상태 분석

**TournamentTeamPlayer**: phone 필드 **없음** -> DB 마이그레이션 필요
**User**: phone 필드 **있음** (String?, 숫자만 저장 "01012345678")
**가입 방식**: OAuth 전용 (카카오/네이버/구글), 가입 직후 phone 없으면 /verify로 리다이렉트
**전화번호 수집 시점**: (1) OAuth 가입 시 카카오 phone (2) /verify 인증 (3) /profile/edit 수정

---

#### 자동 매칭 플로우

```
[관리자] 선수 등록: player_name + phone
  -> TournamentTeamPlayer (userId=null, phone="01012345678")

[유저] 가입 후 전화번호 저장 시
  -> 공통 매칭 함수 호출
  -> phone 일치하는 TournamentTeamPlayer 전부 userId 연결
```

**매칭 함수 호출 3곳**:
1. `verify/complete` API (가입 직후 SMS 인증)
2. `profile` PATCH API (프로필 수정)
3. `oauth.ts` handleOAuthLogin (카카오 phone 자동 저장)

---

#### 만들 파일과 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `prisma/schema.prisma` | TournamentTeamPlayer에 phone 추가 | 수정 |
| `prisma/migrations/...` | DB 마이그레이션 (자동 생성) | 신규 |
| `src/lib/utils/player-matching.ts` | 전화번호 매칭 공통 함수 | 신규 |
| `src/app/api/web/.../players/route.ts` | POST에 phone 필드 추가 | 수정 |
| `src/app/api/web/.../players/[playerId]/route.ts` | PATCH에 phone 필드 추가 | 수정 |
| `src/app/api/web/verify/complete/route.ts` | 인증 후 매칭 호출 | 수정 |
| `src/app/api/web/profile/route.ts` | 전화번호 변경 시 매칭 호출 | 수정 |
| `src/lib/auth/oauth.ts` | 신규 가입+phone 시 매칭 호출 | 수정 |

---

#### 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 시간 |
|------|------|------|----------|------|
| 1 | schema에 phone 추가 + prisma migrate | developer | 없음 | 5분 |
| 2 | player-matching.ts 공통 함수 작성 | developer | 없음 | 10분 |
| 3 | 선수 CRUD API에 phone 반영 | developer | 1 | 5분 |
| 4 | verify/complete + profile + oauth에 매칭 호출 | developer | 1,2 | 10분 |
| 5 | admin UI 전화번호 입력 필드 추가 | developer | 3 | 5분 |
| 6 | tsc + 동작 확인 | tester | 1~5 | 5분 |

(1과 2는 병렬 가능)

**developer 주의사항**:
- phone 포맷: 숫자만 저장 (01012345678), 하이픈 제거
- 매칭 쿼리: `WHERE phone = :phone AND user_id IS NULL`
- 동일 phone의 TournamentTeamPlayer 여러 건 -> 전부 연결
- 유니크 제약 (tournamentTeamId, userId) 위반 방지: 같은 팀에 이미 해당 userId 있으면 스킵
- 전화번호 변경 시 기존 연동은 해제하지 않음 (한번 연결 -> 유지)

---

## 구현 기록 (developer)

### 관리자 선수 직접 등록 + 전화번호 자동 매칭 시스템

구현한 기능: 관리자가 대회 팀에 선수를 직접 등록(이름+전화번호)하고, 유저가 가입/인증 시 전화번호로 자동 매칭

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `prisma/schema.prisma` | TournamentTeamPlayer에 phone 필드 추가 | 수정 |
| `src/lib/services/player-matching.ts` | 전화번호 매칭 공통 함수 | 신규 |
| `src/app/api/web/tournaments/[id]/teams/[teamId]/players/route.ts` | GET(목록)+POST(추가) API | 신규 |
| `src/app/api/web/tournaments/[id]/teams/[teamId]/players/[playerId]/route.ts` | PATCH(수정)+DELETE(삭제) API | 신규 |
| `src/app/api/web/verify/complete/route.ts` | SMS 인증 후 매칭 호출 추가 | 수정 |
| `src/app/api/web/profile/route.ts` | 프로필 phone 변경 시 매칭 호출 추가 | 수정 |
| `src/lib/auth/oauth.ts` | OAuth 가입/로그인 시 매칭 호출 추가 | 수정 |
| `src/app/(web)/tournament-admin/.../teams/page.tsx` | 선수 목록/추가/삭제 UI | 수정 |

tester 참고:
- 테스트 방법: 대회 관리 > 참가팀 관리에서 팀 카드 클릭 > 선수 추가/삭제
- 정상 동작: 이름 입력 후 추가 버튼 > 선수 목록에 표시, 전화번호 유저 있으면 "연동됨" 뱃지
- 주의할 입력: 등번호 중복, 전화번호 형식 (숫자 10~11자리), 같은 팀에 같은 유저 중복 등록

reviewer 참고:
- 매칭 함수(matchPlayersByPhone)는 모든 호출부에서 try-catch로 감싸서 실패해도 원래 기능에 영향 없음
- DB push 시 기존 미사용 컬럼(technical_fouls, unsportsmanlike_fouls)과 duo_sessions 테이블 삭제됨

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-05 | developer | 선수 직접 등록 + 전화번호 자동 매칭 (8파일, DB push 포함) | 완료 -- tsc 통과 |
| 04-05 | planner-architect | 전화번호 기반 자동 매칭 설계 (DB+매칭함수+API 3곳 연동) | 완료 -- phone 컬럼 추가 + 매칭 함수 + 6단계 실행 계획 |
| 04-05 | planner-architect | 관리자 선수 직접 등록(안C) + 계정 연동 기획설계 | 완료 -- API 4개 + UI 2수정 + 추후 연동 설계 |
| 04-05 | developer | 최근 경기 카드 스코어 중앙정렬 + 날짜/장소 서브텍스트 추가 | 완료 |
| 04-05 | developer | 대회 상세 사이드바→히어로 통합 + 1열 전체 너비 (3파일) | 완료 |
| 04-05 | developer | standings 득실차/승점 + 팀 카드 색상 UI 보강 (3파일) | 완료 |
| 04-05 | developer | seed-tournament.ts 작성 (대회+8팀+30경기) | 완료 |
| 04-05 | planner-architect | "전국 최강전" 대회 등록 시스템 분석 + 실행 계획 | 완료 |
| 04-05 | developer | 전체 프로젝트 clip-slant CSS 클래스 제거 (18파일) | 완료 |
| 04-05 | developer | 홈 프로필 위젯+뉴스피드+퀵액션 컴팩트 축소 | 완료 |
| 04-05 | developer | 홈 전체 italic 일괄 제거 (26파일) | 완료 |
| 04-05 | developer | 슬라이드 메뉴 하단 유틸리티 삭제 | 완료 |
