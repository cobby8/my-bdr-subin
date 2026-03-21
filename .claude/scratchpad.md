# 작업 스크래치패드

## 효율화 규칙 (2026-03-21 적용)
1. **병렬 실행**: 독립적인 에이전트는 동시 실행 (tester+reviewer 병렬 등)
2. **스크래치패드 경량 모드**: 소규모 작업(1~2파일)은 작업 로그 한 줄만. 대규모(5+파일)만 섹션 기록
3. **확인 생략**: 명확한 요청은 바로 실행. 모호한 것만 확인 질문
4. **tester+reviewer 병렬**: 동시 실행 후 결과 취합. 소규모는 tester만
5. **커밋 간소화**: tester 통과 시 PM이 직접 커밋. 복잡한 git만 git-manager 호출

## 현재 작업
- **요청**: 코트 찾기 페이지(/courts) Kinetic Pulse 디자인 전환
- **상태**: developer 구현 완료 -> tester 검증 대기
- **현재 담당**: developer 완료

## 작업 계획 (planner) - 코트 찾기 페이지 Kinetic Pulse 전환

### 목표
코트 찾기 페이지(/courts)의 하드코딩 색상을 CSS 변수로 교체하고, bdr_v2_4 디자인 시안에 맞춰 Kinetic Pulse 스타일로 전환

### 대상 파일 (3개)

| 파일 경로 | 역할 | 하드코딩 색상 수 |
|----------|------|----------------|
| `src/app/(web)/courts/page.tsx` | 코트 목록 페이지 | 9건 |
| `src/app/(web)/courts/loading.tsx` | 스켈레톤 로딩 UI | 2건 |
| `src/app/(web)/courts/[id]/page.tsx` | 코트 상세 페이지 | 17건 |

### 하드코딩 색상 -> CSS 변수 매핑

#### courts/page.tsx (코트 목록)

| 위치 | 현재 하드코딩 | 용도 | 변환 대상 CSS 변수 |
|------|-------------|------|-------------------|
| 19행 | `bg-[#EEF2FF]` (hover) | 카드 호버 배경 | `hover:bg-[var(--color-surface-bright)]` |
| 22행 | `text-[#6B7280]` | 주소 텍스트 | `text-[var(--color-text-muted)]` |
| 23행 | `text-[#9CA3AF]` | 메타 정보 텍스트 | `text-[var(--color-text-secondary)]` |
| 24행 | `bg-[#EEF2FF]` | 실내 태그 배경 | `bg-[var(--color-surface-high)]` |
| 25행 | `bg-[rgba(74,222,128,0.2)]` | 무료 태그 배경 | `bg-[rgba(16,185,129,0.15)]` (success 계열) |
| 25행 | `text-[#4ADE80]` | 무료 태그 텍스트 | `text-[var(--color-success)]` |
| 28행 | `text-[#E31B23]` | 평점 색상 | `text-[var(--color-primary)]` |
| 35행 | `text-[#6B7280]` | 빈 목록 텍스트 | `text-[var(--color-text-muted)]` |

#### courts/loading.tsx (스켈레톤)

| 위치 | 현재 하드코딩 | 용도 | 변환 대상 CSS 변수 |
|------|-------------|------|-------------------|
| 12행 | `border-[#E8ECF0]` | 카드 보더 | `border-[var(--color-border)]` |
| 12행 | `bg-white` | 카드 배경 | `bg-[var(--color-card)]` |

#### courts/[id]/page.tsx (코트 상세)

| 위치 | 현재 하드코딩 | 용도 | 변환 대상 CSS 변수 |
|------|-------------|------|-------------------|
| 37행 | `text-[#6B7280]` | "코트 목록" 링크 | `text-[var(--color-text-muted)]` |
| 37행 | `hover:text-[#111827]` | 링크 호버 | `hover:text-[var(--color-text-primary)]` |
| 41행 | `text-[#6B7280]` | 주소 텍스트 | `text-[var(--color-text-muted)]` |
| 49-71행 | `text-[#6B7280]` x6 | 정보 라벨 (유형/바닥재/골대수/이용료/지역/평점/리뷰/체크인) | `text-[var(--color-text-muted)]` |
| 100행 | `text-[#6B7280]` | 편의시설 라벨 | `text-[var(--color-text-muted)]` |
| 104행 | `bg-[#EEF2FF]` | 편의시설 태그 배경 | `bg-[var(--color-surface-high)]` |
| 104행 | `text-[#6B7280]` | 편의시설 태그 텍스트 | `text-[var(--color-text-muted)]` |
| 120행 | `text-[#6B7280]` | 소개 텍스트 | `text-[var(--color-text-muted)]` |
| 128행 | `text-[#6B7280]` | 위치 주소 | `text-[var(--color-text-muted)]` |
| 133행 | `bg-[#1B3C87]` | 카카오맵 버튼 배경 | `bg-[var(--color-accent)]` |
| 148행 | `text-[#9CA3AF]` | 체크인 날짜 | `text-[var(--color-text-secondary)]` |
| 163행 | `border-[#EEF2FF]` | 리뷰 구분선 | `border-[var(--color-border)]` |
| 169행 | `text-[#E31B23]` | 별점 색상 | `text-[var(--color-primary)]` |
| 172행 | `text-[#9CA3AF]` | 리뷰 날짜 | `text-[var(--color-text-secondary)]` |
| 177행 | `text-[#6B7280]` | 리뷰 내용 | `text-[var(--color-text-muted)]` |
| 182행 | `text-[#6B7280]` | 빈 리뷰 텍스트 | `text-[var(--color-text-muted)]` |

### 실행 계획

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 |
|------|------|------|----------|----------|
| 1 | courts/page.tsx 하드코딩 색상 8건 -> CSS 변수 교체 | developer | 5분 | 없음 |
| 2 | courts/loading.tsx 하드코딩 2건 -> CSS 변수 교체 | developer | 3분 | 없음 |
| 3 | courts/[id]/page.tsx 하드코딩 17건 -> CSS 변수 교체 | developer | 10분 | 없음 |
| 4 | tsc + 빌드 검증 + 하드코딩 잔존 확인 | tester | 5분 | 1-3단계 |

총 예상 시간: 23분

### 주의사항

1. **bdr_v2_4 시안과의 차이**: 시안은 "픽업 게임 목록" 화면이지만, 현재 courts 페이지는 "코트 정보 목록". 레이아웃 구조는 유지하고 색상만 교체하는 것이 안전함
2. **Card 컴포넌트**: `@/components/ui/card`를 사용 중. Card 자체의 스타일은 globals.css의 Dark Mode Override에서 이미 CSS 변수로 적용되어 있으므로 Card 내부는 건드리지 않아도 됨
3. **text-[#6B7280] 반복**: 상세 페이지에서 `text-[#6B7280]`이 12회 반복됨. 모두 `text-[var(--color-text-muted)]`로 통일
4. **bg-[#EEF2FF]**: 라이트 테마용 색상(indigo-50). 다크 테마에서는 `var(--color-surface-high)` (#353534)로 대체해야 어두운 배경에서 보임
5. **1-3단계는 독립적**이므로 병렬 실행 가능

### 영향 범위

- 변경 파일: 3개 (courts/ 하위만)
- 다른 페이지 영향: 없음 (courts 전용 파일만 수정)
- CSS 변수 신규 추가: 없음 (기존 변수만 활용)
- 기능 변경: 없음 (색상만 교체)

---

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-21 | architect | Phase 5-1 CSS 변수 전면 교체 설계 (전수조사+매핑+리스크전략+실행순서) | 완료 |
| 2026-03-21 | developer | Phase 5-1 CSS변수 Kinetic Pulse 전환 + Space Grotesk 폰트 | 완료 |
| 2026-03-21 | developer | Phase 5-2 공통 컴포넌트(헤더/슬라이드메뉴/드롭다운) Kinetic Pulse 전환 | 완료 |
| 2026-03-21 | developer | Phase 5-3 홈페이지 5개 컴포넌트 Kinetic Pulse 전면 개편 | 완료 |
| 2026-03-22 | developer | Phase 5-3b 홈페이지 bdr_6 레이아웃 완전 복제 (사이드바+하단네비+섹션 재배치) | 완료 |
| 2026-03-22 | developer | 히어로 2분할 레이아웃 + 유튜브 라이브/인기영상 + 광고 슬라이드 | 완료 |
| 2026-03-22 | developer | 헤더 기능 복구(선호/큰글씨/다크모드/벨/로고) + 강남구 제거 | 완료 |
| 2026-03-22 | developer | 용어 변경(선호->맞춤/관심) + 온보딩 맞춤보기 토글 + prefer_filter_enabled 전달 | 완료 |
| 2026-03-22 | developer | CSS 변수 값 미세 조정 10건 (surface/text/border/radius 등) | 완료 |
| 2026-03-22 | planner | 코트 찾기 페이지(/courts) Kinetic Pulse 전환 계획 수립 | 완료 |
| 2026-03-22 | developer | 코트 찾기 3파일 하드코딩 색상 27건 -> CSS 변수 교체 (page/loading/[id]) | 완료 |
| 2026-03-22 | tester | 코트 찾기 3파일 CSS 변수 교체 검증 (tsc + 하드코딩 잔존 + 변수 사용) | 5/5 통과 |

### 구현 기록 (developer)

구현한 기능: 코트 찾기 페이지 3개 파일의 하드코딩 색상을 CSS 변수로 전면 교체

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/courts/page.tsx | 하드코딩 색상 8건 -> CSS 변수 교체 | 수정 |
| src/app/(web)/courts/loading.tsx | 하드코딩 색상 2건 -> CSS 변수 교체 | 수정 |
| src/app/(web)/courts/[id]/page.tsx | 하드코딩 색상 17건 -> CSS 변수 교체 | 수정 |

tester 참고:
- 테스트 방법: /courts 페이지 및 /courts/[id] 상세 페이지를 라이트/다크 모드 전환하며 확인
- 정상 동작: 모든 텍스트/배경/보더 색상이 테마에 맞게 변경됨
- 주의할 입력: 다크 모드에서 편의시설 태그, 실내/무료 태그, 카카오맵 버튼 색상 확인

reviewer 참고:
- text-[#6B7280] 12회 반복은 replace_all로 일괄 교체함
- bg-[#EEF2FF]는 planner 계획에서 surface-high로 매핑했으나, PM 매핑 규칙에 따라 surface-bright로 통일 적용

### 테스트 결과 (tester)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| TypeScript 컴파일 (`tsc --noEmit`) | 통과 | 에러 0건 |
| 하드코딩 색상 잔존 검사 (#6B7280, #9CA3AF, #111827, #EEF2FF, #E8ECF0, #E31B23, #1B3C87, #4ADE80, bg-white) | 통과 | 검출 0건 - 모두 CSS 변수로 교체됨 |
| CSS 변수 사용 확인 (page.tsx) | 통과 | var(--color-*) 8곳 적용 확인 |
| CSS 변수 사용 확인 (loading.tsx) | 통과 | var(--color-border), var(--color-card) 2곳 적용 확인 |
| CSS 변수 사용 확인 ([id]/page.tsx) | 통과 | var(--color-*) 21곳 적용 확인 (text-muted, text-secondary, primary, accent, border, surface-bright, success) |

종합: 5개 중 5개 통과 / 0개 실패
