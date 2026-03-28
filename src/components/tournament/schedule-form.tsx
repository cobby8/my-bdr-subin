"use client";

import { PlaceAutocomplete, type PlaceSelection } from "@/components/shared/place-autocomplete";

const inputCls =
  "w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

// 경기장 정보 타입 (복수 경기장 지원)
export interface PlaceInfo {
  name: string;
  address: string;
}

export interface ScheduleFormData {
  startDate: string;
  endDate: string;
  registrationStartAt: string;
  registrationEndAt: string;
  // 기존 단일 경기장 (하위 호환)
  venueName: string;
  venueAddress: string;
  city: string;
  // 복수 경기장 배열
  places: PlaceInfo[];
}

interface Props {
  data: ScheduleFormData;
  onChange: (field: keyof ScheduleFormData, value: string | PlaceInfo[]) => void;
}

export function ScheduleForm({ data, onChange }: Props) {
  const places = data.places ?? [];

  // Google Places 검색 결과 → 경기장 추가
  function handlePlaceSelect(place: PlaceSelection) {
    // 첫 번째 경기장이면 기존 필드에도 채움 (하위 호환)
    if (places.length === 0) {
      onChange("venueName", place.name);
      onChange("venueAddress", place.address);
      // 주소에서 도시명 자동 추출
      const cityMatch = place.address.match(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)/);
      if (cityMatch) onChange("city", cityMatch[1]);
    }
    // places 배열에 추가
    const newPlaces = [...places, { name: place.name, address: place.address }];
    onChange("places", newPlaces);
  }

  // 경기장 삭제
  function removePlace(index: number) {
    const newPlaces = places.filter((_, i) => i !== index);
    onChange("places", newPlaces);
    // 첫 번째 경기장이 삭제되면 기존 필드도 업데이트
    if (index === 0) {
      if (newPlaces.length > 0) {
        onChange("venueName", newPlaces[0].name);
        onChange("venueAddress", newPlaces[0].address);
      } else {
        onChange("venueName", "");
        onChange("venueAddress", "");
      }
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">일정 / 장소</h2>

      {/* 대회 기간 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>대회 시작일</label>
          <input
            type="date"
            className={inputCls}
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>대회 종료일</label>
          <input
            type="date"
            className={inputCls}
            value={data.endDate}
            onChange={(e) => onChange("endDate", e.target.value)}
          />
        </div>
      </div>

      {/* 접수 기간 (datetime-local로 변경 -- 시간까지 설정 가능) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>참가 접수 시작</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={data.registrationStartAt}
            onChange={(e) => onChange("registrationStartAt", e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>참가 접수 마감</label>
          <input
            type="datetime-local"
            className={inputCls}
            value={data.registrationEndAt}
            onChange={(e) => onChange("registrationEndAt", e.target.value)}
          />
        </div>
      </div>

      {/* 경기장 검색 + 추가 */}
      <div>
        <label className={labelCls}>
          <span className="material-symbols-outlined align-middle text-base mr-1">location_on</span>
          경기장 검색
          <span className="ml-1 text-xs" style={{ color: "var(--color-text-disabled)" }}>
            (Google 장소 검색)
          </span>
        </label>
        <PlaceAutocomplete
          value=""
          onChange={() => {}}
          onSelect={handlePlaceSelect}
          placeholder="경기장 이름 검색 (예: 잠실체육관)"
          className={inputCls}
        />
      </div>

      {/* 등록된 경기장 목록 */}
      {places.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            등록된 경기장 ({places.length}개)
          </p>
          {places.map((place, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-[8px] border border-[var(--color-border)] p-3"
            >
              <span className="material-symbols-outlined text-[var(--color-accent)]">stadium</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{place.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{place.address}</p>
              </div>
              <button
                type="button"
                onClick={() => removePlace(i)}
                className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 경기장이 없으면 직접 입력 폴백 */}
      {places.length === 0 && (
        <>
          <div>
            <label className={labelCls}>경기장 이름 (직접 입력)</label>
            <input
              className={inputCls}
              value={data.venueName}
              onChange={(e) => onChange("venueName", e.target.value)}
              placeholder="경기장 이름"
            />
          </div>
          <div>
            <label className={labelCls}>주소</label>
            <input
              className={inputCls}
              value={data.venueAddress}
              onChange={(e) => onChange("venueAddress", e.target.value)}
              placeholder="상세 주소"
            />
          </div>
        </>
      )}

      {/* 도시 */}
      <div>
        <label className={labelCls}>도시</label>
        <input
          className={inputCls}
          value={data.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="서울, 부산 등 (자동 입력 또는 직접 입력)"
        />
      </div>
    </div>
  );
}
