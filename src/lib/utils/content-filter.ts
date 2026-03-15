/**
 * 유저 선호 설정 기반 콘텐츠 필터링 유틸리티
 *
 * Prisma where 조건을 생성하여 유저에게 맞는 콘텐츠만 조회합니다.
 * - division이 null(전체)이거나 유저 선호에 포함된 것
 * - target_gender가 null(전체)이거나 유저 선호에 포함된 것
 * - city가 유저 선호 regions에 포함된 것 (비어있으면 전체)
 */

export interface UserPreferences {
  divisions: string[];
  genders: string[];
  regions: string[];
}

/**
 * games, teams, community_posts 등 단일 division/target_gender 필드를 가진 모델용
 */
export function buildSingleCategoryFilter(prefs: UserPreferences) {
  const conditions: Record<string, unknown>[] = [];

  // 종별: null(전체) 또는 유저 선호에 포함
  if (prefs.divisions.length > 0) {
    conditions.push({
      OR: [
        { division: null },
        { division: { in: prefs.divisions } },
      ],
    });
  }

  // 성별: null(전체) 또는 유저 선호에 포함
  if (prefs.genders.length > 0) {
    conditions.push({
      OR: [
        { target_gender: null },
        { target_gender: { in: prefs.genders } },
      ],
    });
  }

  // 지역: 비어있으면 전체, 있으면 매칭
  if (prefs.regions.length > 0) {
    conditions.push({
      OR: [
        { city: null },
        { city: { in: prefs.regions } },
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

/**
 * Tournament 모델용 (divisions는 JSON 배열, target_genders도 JSON 배열)
 * PostgreSQL JSON 배열 겹침 체크: Prisma의 array_contains 대신 raw query 필요할 수 있음
 * 우선 간단한 접근: 전체 조회 후 JS에서 필터링
 */
export function filterTournamentsByPrefs<
  T extends {
    divisions: unknown;
    target_genders?: unknown;
    city?: string | null;
  }
>(tournaments: T[], prefs: UserPreferences): T[] {
  return tournaments.filter((t) => {
    // 종별 체크: 대회 divisions가 빈 배열이면 전체
    const tDivisions = Array.isArray(t.divisions) ? (t.divisions as string[]) : [];
    if (tDivisions.length > 0 && prefs.divisions.length > 0) {
      const hasMatch = tDivisions.some((d) => prefs.divisions.includes(d));
      if (!hasMatch) return false;
    }

    // 성별 체크: target_genders가 빈 배열이면 전체
    const tGenders = Array.isArray(t.target_genders) ? (t.target_genders as string[]) : [];
    if (tGenders.length > 0 && prefs.genders.length > 0) {
      const hasMatch = tGenders.some((g) => prefs.genders.includes(g));
      if (!hasMatch) return false;
    }

    // 지역 체크
    if (prefs.regions.length > 0 && t.city) {
      if (!prefs.regions.includes(t.city)) return false;
    }

    return true;
  });
}
