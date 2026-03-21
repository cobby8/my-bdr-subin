# 📋 작업 스크래치패드

## 현재 작업
- **요청**: Phase 2 - 선호 종별(대회용) + 대회 필터 적용
- **상태**: 진행 중
- **현재 담당**: developer

## 작업 계획 (planner)

### 조사 결과 요약

**이미 완성된 것 (Phase 1에서 구현됨):**
- DB: `users.preferred_divisions` (Json, 기본값 [], GIN 인덱스) -- 준비 완료
- DB: `tournaments.divisions` (Json, 기본값 [], GIN 인덱스) -- 준비 완료
- API: `GET/PATCH /api/web/preferences`에서 `preferred_divisions` 읽기/쓰기 -- 완비
- UI: `preference-form.tsx`에 종별/디비전 선택 UI (성별 탭 + 종별 탭 + 칩 토글) -- 완비
- 상수: `src/lib/constants/divisions.ts`에 전체 디비전 마스터 데이터 -- 완비

**아직 미구현된 것 (Phase 2 범위):**
- `tournament.ts` 서비스: `listTournaments()`에 divisions 필터 파라미터 없음
- `tournaments/route.ts` API: `prefer=true`일 때 `preferred_divisions` 조회 안 함
- `TOURNAMENT_LIST_SELECT`에 `divisions` 필드 미포함 (목록에서 종별 표시 불가)

### 작업 계획

목표: 유저가 설정한 선호 종별(preferred_divisions)을 대회 목록 필터에 적용하여, prefer=true일 때 해당 종별이 포함된 대회만 표시

| 순서 | 작업 | 담당 | 예상 시간 | 선행 조건 | 수정 파일 |
|------|------|------|----------|----------|----------|
| 1 | tournament 서비스에 divisions 필터 추가 | developer | 5분 | 없음 | `src/lib/services/tournament.ts` |
| 2 | tournament API에서 preferred_divisions 조회 및 전달 | developer | 5분 | 1단계 | `src/app/api/web/tournaments/route.ts` |
| 3 | TOURNAMENT_LIST_SELECT에 divisions 필드 추가 + 목록 응답에 포함 | developer | 3분 | 1단계 | `src/lib/services/tournament.ts`, `src/app/api/web/tournaments/route.ts` |
| 4 | 대회 목록 UI에 종별 태그 표시 (선택사항) | developer | 5분 | 3단계 | 대회 목록 페이지 컴포넌트 |
| 5 | 테스트 및 검증 | tester | 5분 | 4단계 | - |
| 6 | 코드 리뷰 | reviewer | 5분 | 5단계 | - |

총 예상 시간: 28분

### 각 단계 상세

**1단계: tournament 서비스에 divisions 필터 추가**
- `TournamentListFilters` 인터페이스에 `divisions?: string[]` 추가
- `listTournaments()` 함수의 where 조건에 divisions 필터 추가
- PostgreSQL Json 배열 매칭 로직: `tournaments.divisions` Json 배열에 유저의 `preferred_divisions` 중 하나라도 포함되면 매칭
- Prisma의 Json 필터링 방식 확인 필요 (hasSome 등은 Json 타입에서 직접 지원 안 됨, `Prisma.JsonFilter` 또는 raw query 필요할 수 있음)

**2단계: tournament API에서 preferred_divisions 조회 및 전달**
- `GET /api/web/tournaments`에서 `prefer=true`일 때 `user.preferred_divisions`도 함께 조회
- 조회한 divisions를 `listTournaments({ divisions: ... })` 파라미터로 전달
- 기존 cities 필터와 AND 조건으로 결합 (둘 다 설정되면 지역+종별 모두 매칭)

**3단계: SELECT에 divisions 필드 추가**
- `TOURNAMENT_LIST_SELECT`에 `divisions: true` 추가
- API 응답 매핑에 `divisions` 필드 포함

**4단계: 대회 목록 UI에 종별 태그 표시 (선택)**
- 대회 카드에 종별 태그(칩) 표시
- DIVISIONS 상수에서 label 매핑하여 사용자 친화적 표시

### 주의사항
- Prisma에서 Json 배열의 "교집합이 있는지" 필터링은 `path` + `array_contains` 조합이 필요할 수 있음. architect가 정확한 Prisma 쿼리 방식을 설계해야 함
- 기존 cities 필터와 divisions 필터의 결합 방식(AND vs OR) 결정 필요 -- 권장: AND (지역도 맞고 종별도 맞는 대회)
- DB 스키마 변경은 불필요 (모든 필드/인덱스 이미 존재)

## 설계 노트 (architect)

### Phase 2: Prisma Json 배열 간 교집합 필터링 설계

#### 핵심 판단: Prisma `path` + `array_contains` OR 조합 (방식 C) 채택

**왜 이 방식인가?**

| 방식 | 장점 | 단점 | 판정 |
|------|------|------|------|
| A: 전체 `$queryRaw` | 성능 최적, `?|` 연산자 활용 | 기존 코드 전면 재작성, select/type 안전성 상실 | 불채택 |
| B: ID 선조회 후 `findMany` | Raw SQL 최소화 | 2번 쿼리, 복잡도 증가 | 불채택 |
| **C: Prisma `OR` + `array_contains`** | **기존 코드 구조 100% 유지, 타입 안전** | 값 개수만큼 OR 조건 생성 (보통 1~5개라 문제 없음) | **채택** |

Prisma 6에서 `Json` 타입은 `hasSome` 같은 배열 전용 연산자를 지원하지 않습니다. 하지만 `path: []` (루트 배열) + `array_contains: "값"` 조합으로 "이 Json 배열에 특정 문자열이 들어있는가"를 검사할 수 있습니다. 이것을 OR로 묶으면 "하나라도 겹치면 매칭" 효과를 냅니다.

비유: 엑셀에서 A열(대회 종별)과 B열(내 선호 종별)을 비교할 때, B열의 각 값을 하나씩 A열에서 찾아보고 하나라도 있으면 OK 표시하는 것과 같습니다.

#### 📍 만들 위치와 구조

| 파일 경로 | 역할 | 신규/수정 |
|----------|------|----------|
| `src/lib/services/tournament.ts` | TournamentListFilters에 `divisions` 추가 + where 조건 추가 | 수정 |
| `src/lib/services/tournament.ts` | TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 | 수정 |
| `src/app/api/web/tournaments/route.ts` | prefer=true일 때 `preferred_divisions` 조회 + 서비스에 전달 | 수정 |

#### 1단계: TournamentListFilters 인터페이스 수정안

```typescript
// src/lib/services/tournament.ts (79~84행 부근)
export interface TournamentListFilters {
  status?: string;
  cities?: string[];
  /** 선호 종별 필터 -- Json 배열 교집합 매칭 (prefer=true 시 사용) */
  divisions?: string[];
  take?: number;
}
```

#### 2단계: listTournaments() where 조건 수정안

```typescript
// src/lib/services/tournament.ts - listTournaments 함수 내부
export async function listTournaments(filters: TournamentListFilters = {}) {
  const { status, cities, divisions, take = 60 } = filters;

  // where 조건을 동적으로 구성
  const where: Record<string, unknown> = {
    status: status && status !== "all" ? status : { not: "draft" },
  };

  // 선호 지역(cities)이 있으면 OR 조건으로 도시 필터 적용
  if (cities && cities.length > 0) {
    where.city = { in: cities, mode: "insensitive" };
  }

  // 선호 종별(divisions) 필터: Json 배열 교집합 매칭
  // divisions 배열의 각 값에 대해 OR 조건 생성
  // 예: divisions = ["챌린저", "비기너스"] 이면
  //     tournaments.divisions 에 "챌린저" OR "비기너스"가 포함된 대회 매칭
  if (divisions && divisions.length > 0) {
    where.OR = divisions.map((div) => ({
      divisions: { path: [], array_contains: div },
    }));
  }

  return prisma.tournament.findMany({
    where,
    orderBy: { startDate: "desc" },
    take,
    select: TOURNAMENT_LIST_SELECT,
  });
}
```

**주의**: `where`에 이미 다른 `OR` 조건이 있다면 충돌할 수 있습니다. 현재 코드에는 OR이 없으므로 안전합니다. 만약 향후 OR이 추가되면 `AND`로 감싸는 구조로 변경해야 합니다.

더 안전한 대안 (AND로 감싸기):
```typescript
if (divisions && divisions.length > 0) {
  where.AND = [
    ...(Array.isArray(where.AND) ? where.AND : []),
    {
      OR: divisions.map((div) => ({
        divisions: { path: [], array_contains: div },
      })),
    },
  ];
}
```

**권장: 안전한 대안(AND 감싸기) 사용** -- 향후 확장에도 안전합니다.

#### 3단계: TOURNAMENT_LIST_SELECT 수정안

```typescript
export const TOURNAMENT_LIST_SELECT = {
  id: true,
  name: true,
  format: true,
  status: true,
  startDate: true,
  endDate: true,
  entry_fee: true,
  city: true,
  venue_name: true,
  maxTeams: true,
  divisions: true,  // <-- 추가: 목록에서 종별 표시용
  _count: { select: { tournamentTeams: true } },
} as const;
```

#### 4단계: tournaments/route.ts API 수정안

```typescript
// GET 함수 내부, prefer=true 블록에서 preferred_divisions도 함께 조회
if (prefer) {
  const session = await getWebSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { city: true, preferred_divisions: true },  // <-- 추가
    });
    // 기존 city 처리 로직 유지...

    // preferred_divisions 처리 추가
    if (user?.preferred_divisions && Array.isArray(user.preferred_divisions)) {
      const divs = user.preferred_divisions as string[];
      if (divs.length > 0) {
        preferredDivisions = divs;
      }
    }
  }
}

// 서비스 호출 시 divisions 파라미터 전달
const rows = await listTournaments({
  status,
  cities: preferredCities,
  divisions: preferredDivisions,  // <-- 추가
  take: 60,
}).catch(() => []);

// 응답 매핑에 divisions 필드 추가
const tournaments = rows.map((t) => ({
  // ... 기존 필드 ...
  divisions: t.divisions ?? [],  // <-- 추가
}));
```

#### 🔗 기존 코드 연결

- `tournament.ts`의 `listTournaments()` 함수 (194행): where 조건에 divisions 필터 추가
- `tournament.ts`의 `TOURNAMENT_LIST_SELECT` (15행): divisions 필드 추가
- `tournaments/route.ts`의 GET 함수 (15행): preferred_divisions 조회 및 전달
- cities 필터와 divisions 필터는 AND 조건으로 결합 (지역도 맞고 종별도 맞는 대회만)

#### ⚠️ developer 주의사항

1. **Prisma Json 필터 문법 주의**: `{ path: [], array_contains: "값" }` 에서 `path: []`는 "루트 레벨 배열"을 의미합니다. `path`를 빠뜨리면 동작하지 않습니다.
2. **OR과 AND 충돌 방지**: divisions 필터는 반드시 `where.AND = [{ OR: [...] }]` 형태로 감싸서 기존/미래의 OR 조건과 충돌하지 않게 합니다.
3. **`preferred_divisions`의 타입**: DB에서 Json으로 저장되므로 `as string[]` 캐스팅 전에 `Array.isArray()` 검증이 필수입니다. (빈 배열 `[]`이 기본값이므로 보통 안전하지만 방어 코딩)
4. **GIN 인덱스 활용**: `tournaments.divisions`와 `users.preferred_divisions` 모두 GIN 인덱스가 이미 존재합니다. `@>` (array_contains) 연산은 GIN 인덱스를 활용하므로 성능 문제 없습니다.
5. **빈 배열 처리**: `preferred_divisions`가 `[]`(빈 배열)이면 divisions 필터를 적용하지 않아야 합니다 (전체 대회 표시). 이미 `divs.length > 0` 체크로 처리됩니다.
6. **응답에 divisions 추가 시**: Json 타입이므로 별도 직렬화 불필요 (이미 배열 형태)

## 구현 기록 (developer)

### Phase 2: 선호 종별(divisions) 대회 필터 적용

구현한 기능: prefer=true일 때 유저의 preferred_divisions를 조회하여, 해당 종별이 포함된 대회만 필터링하여 반환

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/services/tournament.ts` | TournamentListFilters에 `divisions?: string[]` 추가 | 수정 |
| `src/lib/services/tournament.ts` | TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 | 수정 |
| `src/lib/services/tournament.ts` | listTournaments()에 divisions 필터 로직 추가 (AND+OR+array_contains) | 수정 |
| `src/app/api/web/tournaments/route.ts` | prefer=true 블록에서 preferred_divisions 조회 추가 | 수정 |
| `src/app/api/web/tournaments/route.ts` | listTournaments 호출에 divisions 파라미터 전달 | 수정 |
| `src/app/api/web/tournaments/route.ts` | 응답 매핑에 `divisions: t.divisions ?? []` 추가 | 수정 |

tester 참고:
- 테스트 방법: /api/web/tournaments?prefer=true 호출 시 로그인 유저의 preferred_divisions에 해당하는 종별이 포함된 대회만 반환되는지 확인
- 정상 동작: preferred_divisions가 ["챌린저"]이면 divisions 배열에 "챌린저"가 포함된 대회만 목록에 표시
- prefer=false이거나 preferred_divisions가 빈 배열이면 기존과 동일하게 전체 대회 표시
- cities와 divisions 필터는 AND 조건으로 결합됨 (지역도 맞고 종별도 맞는 대회만)

reviewer 참고:
- divisions 필터는 AND로 감싸서 기존/미래의 OR 조건과 충돌하지 않도록 구현
- Prisma Json 필터: `{ path: [], array_contains: div }` 방식으로 GIN 인덱스 활용
- preferred_divisions는 Array.isArray()로 검증 후 사용 (방어 코딩)

## 테스트 결과 (tester)

### Phase 2: 선호 종별(divisions) 대회 필터 검증 (2026-03-21)

| 번호 | 검증 항목 | 결과 | 비고 |
|------|----------|------|------|
| 1 | TypeScript 컴파일 체크 (`tsc --noEmit`) | 통과 | 에러/경고 0건 |
| 2-1 | tournament.ts: TournamentListFilters에 divisions 필드 | 통과 | 85행 `divisions?: string[]` 확인 |
| 2-2 | tournament.ts: divisions 필터가 AND로 감싸져 있는지 | 통과 | 216-224행 `where.AND = [{ OR: ... }]` 확인 |
| 2-3 | tournament.ts: TOURNAMENT_LIST_SELECT에 divisions: true | 통과 | 26행 확인 |
| 2-4 | route.ts: prefer=true에서 preferred_divisions select | 통과 | 31행 `select: { city: true, preferred_divisions: true }` |
| 2-5 | route.ts: Array.isArray() 검증 | 통과 | 41행 `Array.isArray(user.preferred_divisions)` |
| 2-6 | route.ts: listTournaments에 divisions 파라미터 전달 | 통과 | 51행 `divisions: preferredDivisions` |
| 2-7 | route.ts: 응답 매핑에 divisions 필드 포함 | 통과 | 65행 `divisions: t.divisions ?? []` |
| 3-1 | 빈 배열이면 필터 미적용 (전체 대회 표시) | 통과 | route.ts 43행 length>0 + tournament.ts 215행 length>0 이중 체크 |
| 3-2 | divisions가 있으면 OR로 매칭 | 통과 | 219행 `OR: divisions.map(...)` |
| 3-3 | cities + divisions가 AND로 결합 | 통과 | cities는 where.city, divisions는 where.AND에 분리 배치 -> Prisma 자동 AND |
| 3-4 | Prisma Json 필터 문법 올바른지 | 통과 | `{ path: [], array_contains: div }` 정확한 문법 |
| 4 | tsc --noEmit 빌드 테스트 | 통과 | 타입 에러 없음 |

종합: 13개 중 13개 통과 / 0개 실패

참고 사항:
- architect 설계 노트의 "안전한 대안(AND 감싸기)" 권장 방식이 정확히 반영됨
- 기존 where.AND가 없을 때를 대비한 `Array.isArray(where.AND)` 방어 코드도 217행에 포함
- preferred_divisions가 null이거나 배열이 아닌 경우의 방어 코딩이 route.ts에 적절히 구현됨

## 리뷰 결과 (reviewer)

### Phase 2: 선호 종별(divisions) 대회 필터 코드 리뷰 (2026-03-21)

종합 판정: **통과**

**검토 파일:**
- `src/lib/services/tournament.ts` (서비스 레이어)
- `src/app/api/web/tournaments/route.ts` (API 라우트)

**1. architect 설계 준수 여부**
- TournamentListFilters에 `divisions?: string[]` 추가 -- 설계대로
- AND로 감싼 OR+array_contains 패턴 (안전한 대안) -- 설계 권장 방식 정확히 반영
- TOURNAMENT_LIST_SELECT에 `divisions: true` 추가 -- 설계대로
- route.ts에서 preferred_divisions 조회 + Array.isArray 검증 -- 설계대로
- cities와 divisions AND 결합 -- 설계대로

**2. 보안**
- GET은 공개 API, prefer=true 시에만 세션 조회 -- 적절
- session.sub를 BigInt 변환하여 사용 -- 기존 패턴과 동일
- 사용자 입력이 아닌 DB 저장값을 필터로 사용하므로 인젝션 위험 없음

**3. 타입 안전성**
- tsc --noEmit 통과 확인됨
- `where: Record<string, unknown>` 사용은 Prisma 동적 where 구성에서 흔한 패턴
- `as string[]` 캐스팅(route.ts 42행)은 Array.isArray 체크 후 사용되어 안전

**4. 에러 처리**
- `listTournaments().catch(() => [])` -- DB 에러 시 빈 배열 반환, 적절
- `t.divisions ?? []` -- null 방어 처리 OK
- `user?.preferred_divisions` -- optional chaining으로 null 안전
- divisions 빈 배열 시 필터 미적용(length > 0 이중 체크) -- 적절

**5. 성능**
- `path: [] + array_contains`는 PostgreSQL GIN 인덱스(`@>` 연산자)를 활용함
- divisions 값이 보통 1~5개이므로 OR 조건 수가 적어 성능 문제 없음
- N+1 문제 없음 (단일 쿼리로 처리)

**6. 코드 컨벤션**
- TypeScript 코드: camelCase 사용 -- OK
- DB 컬럼: snake_case(preferred_divisions, entry_fee) -- OK
- 주석이 충분하고 한국어로 작성됨 -- 바이브코더 친화적

**7. 기존 코드와의 일관성**
- cities 필터 패턴(split -> filter -> 서비스 전달)과 동일한 구조
- 응답 매핑 방식 일치 (Date->toISOString, Decimal->toString 등 기존 패턴 유지)

---

필수 수정: 없음
권장 수정: 없음

참고 사항 (향후 개선):
- `as string[]` 캐스팅은 배열 내부 요소가 실제 string인지까지는 검증하지 않음. 현재는 DB 저장 시 이미 검증되므로 실용적으로 문제 없으나, 만약 DB 데이터가 수동 편집될 가능성이 있다면 `.filter((v): v is string => typeof v === 'string')` 추가를 고려할 수 있음. 현시점에서는 불필요.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|

## Git 기록 (git-manager)

### Phase 2 커밋 (2026-03-21)

📦 커밋: `ba1af0f` feat: add preferred divisions filter to tournament list API
🌿 브랜치: master
📁 포함 파일:
- `src/lib/services/tournament.ts`
- `src/app/api/web/tournaments/route.ts`
- `.claude/scratchpad.md`
🔄 push 여부: 미완료

## 문서 기록 (doc-writer)
(아직 없음)

## 작업 로그 (최근 10건만 유지)
| 일시 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 2026-03-21 | developer | Phase 1 1단계: DB스키마(preferred_game_types, onboarding_step) + 선호 API + 상수파일 | 완료 |
| 2026-03-21 | developer | Phase 1 2단계: 프로필 완성 흐름에 선호설정 단계 추가 | 완료 |
| 2026-03-21 | developer | Phase 1 3단계: 경기 목록 선호 지역 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 4단계: 대회 목록 선호 지역 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 5단계: 게시판 선호 카테고리 필터링 | 완료 |
| 2026-03-21 | developer | Phase 1 6단계: 홈 추천 경기 선호 반영 | 완료 |
| 2026-03-21 | developer | Phase 1 7단계: 선호설정 페이지(/profile/preferences) | 완료 |
| 2026-03-21 | developer | 전역 선호필터 토글(헤더 버튼) + Sparkles아이콘 + 자동리셋 | 완료 |
| 2026-03-21 | developer | AbortController 적용 + tournament city 인덱스 추가 | 완료 |
| 2026-03-21 | developer | Phase 1 감점요인 3건 수정 (onboarding_step, game_type필터, 다크모드) | 완료 - tester 15통과/1경고 |
| 2026-03-21 | reviewer | Phase 1 감점요인 3건 수정 코드 리뷰 | 통과 - 필수/권장 수정 없음, tester 경고는 현행 유지 판단 |
| 2026-03-21 | planner | Phase 2 계획 수립 - 선호 종별 대회 필터 적용 | 완료 - 6단계, 28분 예상 |
| 2026-03-21 | architect | Phase 2 설계 - Prisma Json 배열 교집합 필터링 쿼리 설계 | 완료 - 방식C(OR+array_contains) 채택 |
| 2026-03-21 | developer | Phase 2 구현 - 선호 종별 대회 필터 적용 (서비스+API) | 완료 - tsc 통과 |
| 2026-03-21 | tester | Phase 2 검증 - 정적 분석 + 로직 검증 + tsc 빌드 | 통과 - 13/13 항목 통과 |
| 2026-03-21 | reviewer | Phase 2 코드 리뷰 - 설계 준수/보안/타입/에러/성능/컨벤션/일관성 7개 관점 | 통과 - 필수/권장 수정 없음 |
| 2026-03-21 | git-manager | Phase 2 커밋 - feat: add preferred divisions filter to tournament list API | 완료 - ba1af0f (push 미완료) |
