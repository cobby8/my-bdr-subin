"use client";

import { useState, useCallback } from "react";
import {
  GENDERS_LIST,
  CATEGORIES_LIST,
  DIVISIONS_BY_CATEGORY,
  type GenderCode,
  type CategoryCode,
} from "@/lib/constants/divisions";

// 종별 자동생성기 모달
// BDR 디비전 체계(성별→종별→디비전)를 단계별로 선택하여
// 위자드의 categories 필드에 한 번에 반영

const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-accent)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

interface Props {
  open: boolean;
  onClose: () => void;
  // 선택된 디비전을 categories 형태로 전달
  onApply: (categories: Record<string, string[]>) => void;
}

export function DivisionGeneratorModal({ open, onClose, onApply }: Props) {
  // 1단계: 성별
  const [gender, setGender] = useState<GenderCode>("male");
  // 2단계: 종별 (복수 선택 가능)
  const [selectedCategories, setSelectedCategories] = useState<CategoryCode[]>([]);
  // 3단계: 디비전 체크박스 (종별별로 선택된 디비전 코드)
  const [selectedDivisions, setSelectedDivisions] = useState<Record<string, string[]>>({});

  // 종별 토글
  const toggleCategory = useCallback((cat: CategoryCode) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  // 디비전 체크박스 토글
  const toggleDivision = useCallback((catLabel: string, divKey: string) => {
    setSelectedDivisions((prev) => {
      const current = prev[catLabel] ?? [];
      const next = current.includes(divKey)
        ? current.filter((d) => d !== divKey)
        : [...current, divKey];
      return { ...prev, [catLabel]: next };
    });
  }, []);

  // 적용 버튼 -- categories 형태로 변환하여 콜백
  function handleApply() {
    // 빈 배열 제거
    const result: Record<string, string[]> = {};
    for (const [cat, divs] of Object.entries(selectedDivisions)) {
      if (divs.length > 0) result[cat] = divs;
    }
    onApply(result);
    onClose();
  }

  // 모달 닫기
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-[16px] bg-[var(--color-card)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined align-middle mr-1">category</span>
            종별 자동생성기
          </h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 1단계: 성별 선택 */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">1. 성별</p>
          <div className="flex gap-2">
            {GENDERS_LIST.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setGender(g.key)}
                className={pillCls(gender === g.key)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2단계: 종별 선택 (복수) */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">2. 종별 (복수 선택)</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES_LIST.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className={pillCls(selectedCategories.includes(cat.key))}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3단계: 디비전 체크박스 */}
        {selectedCategories.length > 0 && (
          <div className="mb-4 max-h-[250px] overflow-y-auto">
            <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">3. 디비전 선택</p>
            {selectedCategories.map((catCode) => {
              const catInfo = CATEGORIES_LIST.find((c) => c.key === catCode);
              if (!catInfo) return null;
              const divisions = DIVISIONS_BY_CATEGORY[gender][catCode];
              const catLabel = `${catInfo.label}${gender === "female" ? "(여)" : ""}`;

              return (
                <div key={catCode} className="mb-3">
                  <p className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">{catLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {divisions.map((div) => {
                      const checked = (selectedDivisions[catLabel] ?? []).includes(div.key);
                      return (
                        <label
                          key={div.key}
                          className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                            checked
                              ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                              : "bg-[var(--color-border)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDivision(catLabel, div.key)}
                            className="accent-[var(--color-accent)]"
                          />
                          {div.label}
                          {div.subtitle && (
                            <span className="text-xs text-[var(--color-text-muted)]">({div.subtitle})</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="rounded-[4px] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-border)]"
          >
            취소
          </button>
          <button
            onClick={handleApply}
            disabled={Object.values(selectedDivisions).flat().length === 0}
            className="rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
