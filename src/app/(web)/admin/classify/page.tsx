"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DIVISION_LABEL, GENDER_LABEL, type Division, type Gender } from "@/lib/constants/categories";

export const dynamic = "force-dynamic";

type ContentType = "tournament" | "game" | "team" | "post";

const TAB_LABELS: Record<ContentType, string> = {
  tournament: "대회",
  game: "경기",
  team: "팀",
  post: "게시글",
};

interface ClassifyItem {
  id: string;
  title: string;
  description: string | null;
  status: unknown;
  date: string | null;
}

export default function AdminClassifyPage() {
  const [activeTab, setActiveTab] = useState<ContentType>("tournament");
  const [items, setItems] = useState<ClassifyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<ContentType, number>>({
    tournament: 0, game: 0, team: 0, post: 0,
  });

  // 개별 항목의 선택값 관리
  const [selections, setSelections] = useState<
    Record<string, { division?: string; gender?: string }>
  >({});

  // 일괄 선택
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [batchDivision, setBatchDivision] = useState("");
  const [batchGender, setBatchGender] = useState("");

  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async (type: ContentType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/classify?type=${type}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setCounts((prev) => ({ ...prev, [type]: json.data.total }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // 탭 변경 시 모든 탭 카운트 로드
  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab, fetchItems]);

  // 최초 로드 시 전체 카운트 가져오기
  useEffect(() => {
    const types: ContentType[] = ["tournament", "game", "team", "post"];
    types.forEach(async (type) => {
      try {
        const res = await fetch(`/api/admin/classify?type=${type}`);
        const json = await res.json();
        if (json.success) {
          setCounts((prev) => ({ ...prev, [type]: json.data.total }));
        }
      } catch {
        // ignore
      }
    });
  }, []);

  const handleSelectionChange = (id: string, field: "division" | "gender", value: string) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value || undefined },
    }));
  };

  const handleSave = async (id: string) => {
    const sel = selections[id];
    if (!sel?.division && !sel?.gender) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/classify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            type: activeTab,
            id,
            ...(sel.division && { division: sel.division }),
            ...(sel.gender && { target_gender: sel.gender }),
          }],
        }),
      });
      const json = await res.json();
      if (json.success) {
        // 저장 성공 → 목록에서 제거
        setItems((prev) => prev.filter((i) => i.id !== id));
        setCounts((prev) => ({ ...prev, [activeTab]: prev[activeTab] - 1 }));
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleBatchSave = async () => {
    if (checkedIds.size === 0 || !batchDivision) return;

    setSaving(true);
    try {
      const batchItems = Array.from(checkedIds).map((id) => ({
        type: activeTab,
        id,
        division: batchDivision,
        ...(batchGender && { target_gender: batchGender }),
      }));

      const res = await fetch("/api/admin/classify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: batchItems }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => !checkedIds.has(i.id)));
        setCounts((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab] - checkedIds.size,
        }));
        setCheckedIds(new Set());
        setBatchDivision("");
        setBatchGender("");
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllChecks = () => {
    if (checkedIds.size === items.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(items.map((i) => i.id)));
    }
  };

  const totalUnclassified = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">콘텐츠 분류</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            미분류 콘텐츠에 종별/성별을 지정합니다. 총 {totalUnclassified}건 미분류
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="mb-4 flex gap-2">
        {(Object.keys(TAB_LABELS) as ContentType[]).map((type) => (
          <button
            key={type}
            onClick={() => { setActiveTab(type); setCheckedIds(new Set()); }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === type
                ? "bg-[#0066FF] text-white"
                : "bg-white text-[#6B7280] hover:bg-[#F3F4F6]"
            }`}
          >
            {TAB_LABELS[type]}
            {counts[type] > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === type ? "bg-white/20 text-white" : "bg-[#EF4444] text-white"
              }`}>
                {counts[type]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 일괄 분류 바 */}
      {checkedIds.size > 0 && (
        <Card className="mb-4 flex items-center gap-3 p-3">
          <span className="text-sm font-medium text-[#111827]">
            {checkedIds.size}건 선택됨
          </span>
          <select
            value={batchDivision}
            onChange={(e) => setBatchDivision(e.target.value)}
            className="rounded-md border border-[#D1D5DB] px-3 py-1.5 text-sm"
          >
            <option value="">종별 선택</option>
            {Object.entries(DIVISION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={batchGender}
            onChange={(e) => setBatchGender(e.target.value)}
            className="rounded-md border border-[#D1D5DB] px-3 py-1.5 text-sm"
          >
            <option value="">성별 (전체)</option>
            {Object.entries(GENDER_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={handleBatchSave}
            disabled={saving || !batchDivision}
            className="rounded-lg bg-[#F4A261] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#E8954F] disabled:opacity-50"
          >
            {saving ? "저장 중..." : "일괄 적용"}
          </button>
        </Card>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse bg-[#F3F4F6]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <p className="text-[#9CA3AF]">미분류 {TAB_LABELS[activeTab]}이(가) 없습니다</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* 전체 선택 */}
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              checked={checkedIds.size === items.length && items.length > 0}
              onChange={toggleAllChecks}
              className="h-4 w-4 rounded border-[#D1D5DB]"
            />
            <span className="text-xs text-[#9CA3AF]">전체 선택</span>
          </div>

          {items.map((item) => (
            <Card key={item.id} className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                checked={checkedIds.has(item.id)}
                onChange={() => toggleCheck(item.id)}
                className="mt-1 h-4 w-4 rounded border-[#D1D5DB]"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#111827] truncate">{item.title}</span>
                  {item.date && (
                    <span className="shrink-0 text-xs text-[#9CA3AF]">
                      {new Date(item.date).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-[#6B7280] line-clamp-2">{item.description}</p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={selections[item.id]?.division ?? ""}
                  onChange={(e) => handleSelectionChange(item.id, "division", e.target.value)}
                  className="rounded-md border border-[#D1D5DB] px-2 py-1.5 text-sm"
                >
                  <option value="">종별</option>
                  {Object.entries(DIVISION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={selections[item.id]?.gender ?? ""}
                  onChange={(e) => handleSelectionChange(item.id, "gender", e.target.value)}
                  className="rounded-md border border-[#D1D5DB] px-2 py-1.5 text-sm"
                >
                  <option value="">전체</option>
                  {Object.entries(GENDER_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(item.id)}
                  disabled={saving || !selections[item.id]?.division}
                  className="rounded-lg bg-[#0066FF] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0052CC] disabled:opacity-50"
                >
                  저장
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
