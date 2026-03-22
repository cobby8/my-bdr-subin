# 기술 결정 이력
<!-- 담당: planner-architect | 최대 30항목 -->
<!-- "왜 A 대신 B를 선택했는지" 기술 결정의 배경과 이유를 기록 -->

### [2026-03-22] 경기 페이지 리디자인: API 로직 유지, UI만 변경
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 경기 3종 페이지 리디자인 시 데이터 호출 로직(fetch URL, Server Action, 서비스 함수)은 일절 변경하지 않고 UI 렌더링 부분만 교체한다.
- **이유**: (1) API가 Flutter 앱과 100% 호환되어야 하므로 건드리면 위험. (2) 현재 데이터 흐름이 안정적으로 동작 중. (3) 리디자인 범위를 UI로 한정해야 작업 시간과 리스크를 줄일 수 있음.
- **대안**: 경기 이미지(image_url) 등 신규 필드가 필요한 경우 DB에 없으면 placeholder로 대체, API 변경은 별도 작업으로 분리.
- **참조횟수**: 0

### [2026-03-22] 경기 생성 위자드: fixed 오버레이 -> 일반 페이지 내 배치
- **분류**: decision
- **발견자**: planner-architect
- **결정**: 현재 경기 생성 위자드가 `fixed inset-0 z-[100]`으로 전체 화면을 덮는 오버레이인데, 디자인 시안에서는 일반 페이지 내 2열 레이아웃(폼+Summary)으로 변경.
- **이유**: (1) 시안이 사이드바가 보이는 일반 페이지 내 배치를 보여줌. (2) 오버레이 방식은 모바일에서는 좋지만 데스크탑에서 사이드바 네비게이션이 가려져 UX가 단절됨.
- **주의**: 모바일에서는 여전히 전체화면처럼 보이도록 반응형 처리 필요 (xl: 이상에서만 2열).
- **참조횟수**: 0

### [2026-03-23] lucide-react → Material Symbols Outlined 전체 교체
- **분류**: decision
- **발견자**: pm
- **결정**: 레이아웃만 교체(B안)가 아닌, 프로젝트 전체에서 lucide-react를 제거하고 Material Symbols Outlined로 통일(A안).
- **이유**: (1) 디자인 시안이 Material Symbols 기준으로 작성됨. (2) 두 라이브러리 혼용은 번들 크기 증가+일관성 저하. (3) 사용자가 A안 선택.
- **영향**: 19파일, ~50개 아이콘 교체. lucide-react 의존성 제거 가능.
- **참조횟수**: 1

### [2026-03-23] YouTube 인기 영상: Search API → playlistItems 페이지네이션
- **분류**: decision
- **발견자**: pm (디버깅 과정에서)
- **결정**: YouTube Search API(order=viewCount)가 실제 조회수와 다른 결과를 반환하여, playlistItems 3페이지(150개) + Videos API 실제 조회수 조회 + 서버 정렬 방식으로 변경.
- **이유**: (1) Search API 부정확 (10,092뷰 영상이 1,518뷰 아래 표시). (2) 쿼터 97% 절약 (200→6). (3) playlistItems+Videos는 정확한 viewCount 반환.
- **대안**: YouTube Analytics API (더 정확하지만 OAuth 필요, 구현 복잡도 높음)
- **참조횟수**: 1
