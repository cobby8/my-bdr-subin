"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { DIVISION_LABEL, GENDER_LABEL } from "@/lib/constants/categories";

const STATUSES = [
  { value: "all",               label: "전체" },
  { value: "registration_open", label: "모집중" },
  { value: "ongoing",           label: "진행중" },
  { value: "completed",         label: "완료" },
];

const selectCls =
  "h-10 appearance-none rounded-[12px] border border-[#E8ECF0] bg-[#FFFFFF] pl-3 pr-8 text-sm text-[#111827] focus:border-[#0066FF]/60 focus:outline-none cursor-pointer";

export function TournamentsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("status") ?? "all";

  const update = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (!v || v === "all") sp.delete(k);
        else sp.set(k, v);
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, params]
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <div className="flex gap-1.5 overflow-x-auto">
        {STATUSES.map((s) => {
          const active = current === s.value;
          return (
            <button
              key={s.value}
              onClick={() => update({ status: s.value })}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-[#0066FF] text-white"
                  : "border border-[#E8ECF0] text-[#6B7280] hover:border-[#0066FF]/40 hover:text-[#111827]"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="relative flex-shrink-0">
        <select
          value={params.get("division") ?? "all"}
          onChange={(e) => update({ division: e.target.value })}
          className={selectCls}
        >
          <option value="all">전체 종별</option>
          {Object.entries(DIVISION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="relative flex-shrink-0">
        <select
          value={params.get("gender") ?? "all"}
          onChange={(e) => update({ gender: e.target.value })}
          className={selectCls}
        >
          <option value="all">전체 성별</option>
          {Object.entries(GENDER_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
