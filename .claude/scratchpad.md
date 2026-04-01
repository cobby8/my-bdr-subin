# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 캘린더 뷰 (월간/주간) 구현
- **상태**: 구현 완료 (tsc 통과, 기존 lucide-react 에러 1건만 잔존)
- **현재 담당**: developer

### 구현 기록

구현한 기능: 대회 캘린더 3뷰 시스템 (리스트/월간/주간) — 6파일 신규/수정

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/constants/calendar-colors.ts | 8색 상수 + getCalendarColor() + CALENDAR_COLOR_LEGEND | 신규 |
| src/app/api/web/tournaments/calendar/route.ts | GET (year/month/category/gender) 캘린더 전용 API | 신규 |
| src/app/(web)/tournaments/_components/view-toggle.tsx | 3뷰 전환 토글 (list/calendar/week) | 신규 |
| src/app/(web)/tournaments/_components/calendar-view.tsx | 월간 CSS Grid 캘린더 + 범례 + 날짜 클릭 상세 | 신규 |
| src/app/(web)/tournaments/_components/week-view.tsx | 주간 7열 타임라인 뷰 | 신규 |
| src/app/(web)/tournaments/_components/tournaments-content.tsx | ViewToggle 추가 + 뷰별 조건부 렌더링 | 수정 |

tester 참고:
- /tournaments 페이지에서 "대회 찾기" 옆에 리스트/월간/주간 토글 버튼 확인
- 월간 뷰: 좌우 화살표로 월 이동, 날짜 클릭 시 해당일 대회 목록 표시, "범례" 버튼으로 8색 범례 토글
- 주간 뷰: 7일 타임라인, 좌우 화살표로 주 이동, "이번주" 버튼
- 리스트 뷰: 기존과 100% 동일 (변경 없음)
- 종별/성별 필터가 캘린더/주간 뷰에도 전달됨

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 (+6: partner-admin 5P + venues 1P + invite 1P) |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 111개 라우트 (+1: tournaments/calendar) |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 04-01 | developer | #7 파트너셀프서비스+#8 대관+#9 카페이전 (API7+페이지7, 14파일) | 완료 |
| 04-01 | developer | #1~#6 역할체계+단체승인제 (타입에러1건 수정) | 완료 |
| 04-01 | developer | 네이티브 광고 시스템 MVP (스키마4모델+API4+Admin2P+광고컴포넌트+삽입3곳, 13파일) | 완료 |
| 04-01 | developer | Organization 3단계 계층 (스키마+API7개+관리4P+공개3P+기존연결, 15파일) | 완료 |
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
