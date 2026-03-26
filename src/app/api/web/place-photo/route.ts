import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

// --- 인메모리 캐시: 같은 장소명 반복 조회 방지 (1시간 TTL) ---
interface CacheEntry {
  photoUrl: string | null; // null = 사진 없음도 캐시 (불필요한 재조회 방지)
  expiresAt: number;
}
const photoCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// 5분마다 만료된 캐시 정리 (메모리 누수 방지)
if (typeof globalThis !== "undefined") {
  const existing = (globalThis as Record<string, unknown>).__placePhotoCacheCleanup;
  if (!existing) {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of photoCache) {
        if (entry.expiresAt < now) photoCache.delete(key);
      }
    }, 5 * 60 * 1000);
    if (interval.unref) interval.unref();
    (globalThis as Record<string, unknown>).__placePhotoCacheCleanup = true;
  }
}

/**
 * Google Places API proxy
 *
 * 왜 서버에서 proxy하는가:
 * 1. API 키를 클라이언트에 노출하지 않기 위해 (보안)
 * 2. Place Photo URL에 API 키가 포함되므로 직접 전달 불가
 * 3. 인메모리 캐시로 동일 장소 반복 호출 방지 (비용 절약)
 *
 * GET /api/web/place-photo?query=강남스포츠문화센터
 * 응답: { photo_url: "https://..." } 또는 { photo_url: null }
 */
export async function GET(request: NextRequest) {
  // API 키가 없으면 빈 응답 (로컬 개발에서도 에러 없이 동작)
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ photo_url: null });
  }

  // Rate limit: 분당 30회 (Google Places API 비용 보호)
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitResult = await checkRateLimit(
    `place-photo:${ip}`,
    { maxRequests: 30, windowMs: RATE_LIMITS.api.windowMs }
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", photo_url: null },
      { status: 429 }
    );
  }

  // query 파라미터 검증
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2 || query.length > 100) {
    return NextResponse.json({ photo_url: null });
  }

  // 캐시 확인 (히트하면 Google API 호출 생략)
  const cacheKey = query.toLowerCase();
  const cached = photoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(
      { photo_url: cached.photoUrl },
      {
        headers: {
          "Cache-Control": "public, max-age=3600", // 브라우저도 1시간 캐시
        },
      }
    );
  }

  try {
    // 1단계: Google Places Text Search로 장소 검색
    const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("language", "ko");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      console.error("[PlacePhoto] Text Search failed:", searchRes.status);
      return NextResponse.json({ photo_url: null });
    }

    const searchData = await searchRes.json();
    const firstResult = searchData.results?.[0];
    const photoRef = firstResult?.photos?.[0]?.photo_reference;

    // 사진 참조가 없으면 null 캐시 후 반환
    if (!photoRef) {
      photoCache.set(cacheKey, { photoUrl: null, expiresAt: Date.now() + CACHE_TTL });
      return NextResponse.json({ photo_url: null });
    }

    // 2단계: Place Photo URL 생성
    // Google Place Photo API는 302 redirect로 실제 이미지 URL을 반환함
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${apiKey}`;

    // redirect를 따라가서 최종 이미지 URL 획득 (API 키가 포함되지 않은 URL)
    const photoRes = await fetch(photoUrl, { redirect: "follow" });
    const finalUrl = photoRes.url; // redirect 후 최종 URL (API 키 없음)

    // 캐시에 저장
    photoCache.set(cacheKey, { photoUrl: finalUrl, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(
      { photo_url: finalUrl },
      {
        headers: {
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("[PlacePhoto] Error:", error);
    return NextResponse.json({ photo_url: null });
  }
}
