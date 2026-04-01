# 작업 스크래치패드

## 현재 작업
- **요청**: 접근 제어 + 관리 링크 5가지 수정
- **상태**: 구현 완료 (tsc 통과, 기존 lucide-react 에러 1건만 잔존)
- **현재 담당**: developer

### 구현 기록

구현한 기능: 역할별 관리 링크 + 경로 보호 + 권한 에러 메시지 (6파일 수정)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/shared/slide-menu.tsx | 역할별 관리 링크 (admin/tournament-admin/partner-admin) | 수정 |
| src/app/(web)/layout.tsx | PC 사이드네비 하단에 역할별 관리 링크 추가 | 수정 |
| src/proxy.ts | PROTECTED_PATHS에 community/new, organizations/apply, partner-admin, tournament-admin 추가 | 수정 |
| src/app/(web)/organizations/page.tsx | "단체 개설 신청" 버튼 추가 | 수정 |
| src/app/(web)/tournament-admin/layout.tsx + src/app/(admin)/admin/layout.tsx | redirect("/login?error=no_permission") | 수정 |
| src/app/(web)/login/page.tsx | no_permission 에러 메시지 표시 | 수정 |

tester 참고:
- 슬라이드 메뉴/사이드네비: super_admin이면 관리자+대회관리+파트너관리 3개 표시
- tournament_admin이면 대회관리+파트너관리 2개 표시
- 일반 유저면 파트너관리 1개만 표시 (접근 시 소속 확인은 layout에서)
- /community/new, /organizations/apply: 미로그인 시 /login으로 리다이렉트
- 권한 없는 관리 페이지 접근 시 /login?error=no_permission → "해당 페이지에 접근할 권한이 없습니다." 표시

## 전체 프로젝트 현황 대시보드 (2026-04-01)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 84개 (+6: partner-admin 5P + venues 1P + invite 1P) |
| 관리자 페이지 (admin) | 16개 |
| Prisma 모델 | 73개 |
| Web API | 110개 라우트 (+7: partner/* 6개 + venues 1개) |

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
