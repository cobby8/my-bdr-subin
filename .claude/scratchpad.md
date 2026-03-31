# 작업 스크래치패드

## 현재 작업
- **요청**: PC 우측 사이드바 구현 (3파일)
- **상태**: 구현 완료 (tsc 통과)
- **현재 담당**: developer

### 구현 기록

구현한 기능: PC 우측 사이드바 (BDR랭킹+주목팀+인기코트+최근활동, 3파일)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/sidebar/route.ts | 통합 API (4쿼리 병렬, 5분 ISR 캐시) | 신규 |
| src/components/layout/right-sidebar.tsx | 4개 위젯 + useSWR + 스켈레톤 + 에러 숨김 | 신규 |
| src/app/(web)/layout.tsx | main을 flex 래퍼로 감싸고 xl에서 사이드바 표시 | 수정 |

tester 참고:
- xl(1280px) 이상에서만 우측 사이드바 표시 (모바일/태블릿 변경 없음)
- BDR 랭킹: XP 높은 순 TOP5, 클릭 시 /profile/{id}
- 주목할 팀: 승수 높은 순 TOP3, 승률% + N승 N패
- 인기 코트: 최근 7일 체크인 수 TOP5, 클릭 시 /courts/{id}
- 최근 활동: 체크인 5건, "닉네임이 코트명에 체크인" + 상대시간
- /api/web/sidebar 호출 확인 (인증 불필요, 5분 캐시)
- 데이터 없으면 해당 위젯 미표시, 에러 시 사이드바 전체 숨김

---

이전 구현 기록: 홈 히어로 개인화 + 픽업게임 실내/야외 구분 (7파일)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/dashboard/route.ts | 자주가는코트TOP3+활동프로필+선호설정 3쿼리 추가 | 수정 |
| src/app/api/web/home/news/route.ts | court_type 포함 + regions 파라미터 우선정렬 | 수정 |
| src/app/api/web/courts/[id]/pickups/route.ts | 응답에 courtType 필드 추가 | 수정 |
| src/components/home/home-hero.tsx | useSWR(dashboard) + props 전달 + DashboardData 타입 | 수정 |
| src/components/home/quick-actions.tsx | 활동프로필 기반 동적 버튼 생성 | 수정 |
| src/components/home/profile-widget.tsx | 자주가는코트+다음경기 링크 추가 | 수정 |
| src/components/home/news-feed.tsx | preferredRegions prop + 픽업 실내/야외 뱃지 | 수정 |
| src/app/(web)/courts/[id]/_components/court-pickups.tsx | 실내/야외 뱃지 추가 | 수정 |

tester 참고:
- 비로그인: 기존과 동일 (퀵액션 3고정버튼 + 소식피드)
- 로그인(신규유저): dominantType="new" → 기본 버튼 3개
- 로그인(체크인많은유저): 퀵액션 1번에 "코트명 체크인", 프로필위젯에 자주가는코트 표시
- 로그인(경기참가유저): 퀵액션 1번에 "다음 경기 D-N"
- 픽업게임 카드에 실내(파란)/야외(초록) 뱃지 표시
- /api/web/home/news?regions=서울,경기 호출 시 해당 지역 소식 우선 정렬
- /api/web/dashboard 응답에 frequentCourts, activityProfile, preferredRegions 추가 확인

## 전체 프로젝트 현황 대시보드 (2026-03-31)

### 규모 요약
| 항목 | 수치 |
|------|------|
| 웹 페이지 (web) | 71개 |
| 관리자 페이지 (admin) | 14개 |
| 사이트 페이지 (_site) | 6개 |
| 라이브 페이지 | 2개 |
| Web API | 91개 라우트 |
| Flutter API (v1) | 33개 라우트 |
| Cron | 2개 (대회알림, 주간리포트) |
| Prisma 모델 | 67개 (comment_likes 추가) |
| 코트 데이터 | 1,045개 (카카오 실데이터) |
| tsc 에러 | 0개 |

### 기능 완성도 (영역별)
| 영역 | 완성도 | 상세 |
|------|--------|------|
| 인증 | 95% | 로그인/회원가입/소셜/JWT/비밀번호재설정/회원탈퇴 |
| 홈 | 85% | 6섹션 구성, ISR, API 연동 |
| 대회 | 95% | CRUD/위자드/팀관리/대진표/참가신청/시리즈 |
| 경기 | 95% | 게스트/픽업/팀매치/위자드/신청관리/라이브/수정/취소 |
| 팀 | 90% | 생성/관리/멤버/가입신청/팔로우/수정/해산 |
| 코트 | 95% | 지도/체크인/리뷰/제보/위키/픽업/앰배서더/이벤트/QR/히트맵 |
| 프로필 | 90% | 정보수정/스탯/게이미피케이션/주간리포트/결제내역/구독관리/소셜계정표시 |
| 커뮤니티 | 90% | 게시판/댓글/글쓰기/좋아요/이미지첨부/댓글좋아요/수정/삭제 |
| 랭킹 | 95% | BDR랭킹(외부xlsx)/시즌드롭다운/플랫폼팀/플랫폼개인 |
| 관리자 | 85% | users/tournaments/courts/ambassadors필터/알림발송/7일차트/analytics보강 |
| PWA | 90% | manifest+Serwist+웹푸시+설치배너 |
| 알림 | 90% | 인앱+웹푸시(VAPID)+유형별 설정+개별삭제 |
| 검색 | 95% | 통합 검색(코트+유저) + 자동완성 + 최근검색어 |
| 결제 | 95% | 요금제/체크아웃/성공/실패/환불/내역/구독관리 |

### 완료된 Phase
| Phase | 작업 | 상태 |
|-------|------|------|
| 1. 정리 | tsc 0건 + xlsx 동적 import + 레거시 정리 | ✅ |
| 2. 소셜 | 팔로우/좋아요 알림 연동 | ✅ |
| 3. 알림 | 웹 푸시 알림 전체 구현 | ✅ |
| 4. 성능 | unstable_cache + 동적 import + 인덱스 | ✅ |
| 5. 배포 | main 머지 + GitHub 푸시 | ✅ |

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-31 | developer | #8 검색코트 + #9 알림설정 + #10 PWA배너 (7파일) | 완료 |
| 03-31 | developer | 비밀번호 재설정 + 회원 탈퇴 (8파일) | 완료 |
| 03-31 | pm | main 머지 + 푸시 (Phase 5 성능 + 소셜) | 완료 |
| 03-31 | developer | #16관리자+#17검색+#18알림 (차트/발송/유저검색/최근검색/삭제) | 완료 |
| 03-31 | developer | 경기 수정/취소 + 팀 수정/해산 API+UI (5파일) | 완료 |
| 03-31 | developer | #21소셜+#22이미지/댓글좋아요+#23시즌+#24admin보강 (8파일) | 완료 |
| 03-31 | developer | SMS Redis저장소+RateLimit4API+에러추적 (9파일) | 완료 |
| 03-31 | developer | middleware+error.tsx+헬스체크 (3파일 신규) | 완료 |
| 03-31 | developer | #7메타데이터(9파일)+#9loading(7파일)+#12모바일검색(1파일) | 완료 |
| 03-31 | developer | #13SVG차단+#14sitemap동적+#15user_id주석 (3파일) | 완료 |
| 03-31 | developer | 홈 히어로 개인화+픽업 실내/야외 (대시보드API확장+동적버튼+뱃지, 8파일) | 완료 |
| 03-31 | developer | 홈 히어로 리디자인 (프로필위젯+퀵액션+소식피드, 6파일) | 완료 |
