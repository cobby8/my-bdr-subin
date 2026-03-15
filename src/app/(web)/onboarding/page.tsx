"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DIVISIONS,
  DIVISION_LABEL,
  GENDERS,
  GENDER_LABEL,
  REGIONS,
  type Division,
  type Gender,
  type Region,
} from "@/lib/constants/categories";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleItem<T>(list: T[], item: T, setter: (v: T[]) => void) {
    setter(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/web/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisions, genders, regions }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "저장에 실패했습니다.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      title: "관심 종별을 선택해주세요",
      subtitle: "복수 선택 가능합니다",
      items: DIVISIONS.map((d) => ({
        key: d,
        label: DIVISION_LABEL[d],
        selected: divisions.includes(d),
        toggle: () => toggleItem(divisions, d, setDivisions),
      })),
      valid: divisions.length > 0,
    },
    {
      title: "관심 성별을 선택해주세요",
      subtitle: "복수 선택 가능합니다",
      items: GENDERS.map((g) => ({
        key: g,
        label: GENDER_LABEL[g],
        selected: genders.includes(g),
        toggle: () => toggleItem(genders, g, setGenders),
      })),
      valid: genders.length > 0,
    },
    {
      title: "활동 지역을 선택해주세요",
      subtitle: "복수 선택 가능합니다",
      items: REGIONS.map((r) => ({
        key: r,
        label: r,
        selected: regions.includes(r),
        toggle: () => toggleItem(regions, r, setRegions),
      })),
      valid: regions.length > 0,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#F4A261]" : "bg-[#E5E7EB]"
            }`}
          />
        ))}
      </div>

      <h1 className="mb-1 text-2xl font-bold">{current.title}</h1>
      <p className="mb-6 text-sm text-[#6B7280]">{current.subtitle}</p>

      {/* Checkbox grid */}
      <div
        className={`grid gap-3 ${
          step === 2 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2"
        }`}
      >
        {current.items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={item.toggle}
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              item.selected
                ? "border-[#F4A261] bg-[#F4A261]/10 text-[#F4A261]"
                : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
            className="flex-1"
          >
            이전
          </Button>
        )}
        {isLast ? (
          <Button
            onClick={handleSubmit}
            disabled={!current.valid || loading}
            className="flex-1"
          >
            {loading ? "저장 중..." : "시작하기"}
          </Button>
        ) : (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!current.valid}
            className="flex-1"
          >
            다음
          </Button>
        )}
      </div>

      <Card className="mt-8 bg-[#F9FAFB] text-center text-xs text-[#9CA3AF]">
        프로필 설정에서 언제든 변경할 수 있습니다
      </Card>
    </div>
  );
}
