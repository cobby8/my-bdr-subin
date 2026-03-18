"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

const CITIES = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

/** 숫자만 추출 후 000-0000-0000 형식으로 변환 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/** 포맷된 번호에서 숫자만 추출 */
function stripPhone(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export default function ProfileCompletePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    position: "",
    height: "",
    weight: "",
    bio: "",
  });

  // 전화번호 인증 상태
  const [verifyStep, setVerifyStep] = useState<"idle" | "sent" | "verified">("idle");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  const handlePhoneChange = useCallback((value: string) => {
    const formatted = formatPhone(value);
    setForm((p) => ({ ...p, phone: formatted }));
    // 번호 변경 시 인증 초기화
    if (verifyStep !== "idle") {
      setVerifyStep("idle");
      setVerifyCode("");
      setVerifyError("");
    }
  }, [verifyStep]);

  const handleSendCode = async () => {
    const digits = stripPhone(form.phone);
    if (digits.length < 10 || digits.length > 11) {
      setVerifyError("올바른 전화번호를 입력하세요.");
      return;
    }
    setSendingCode(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/web/verify/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "인증번호 발송 실패");
      setVerifyStep("sent");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length < 4) {
      setVerifyError("인증번호를 입력하세요.");
      return;
    }
    setVerifyError("");
    try {
      const res = await fetch("/api/web/verify/confirm-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: stripPhone(form.phone), code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "인증 실패");
      setVerifyStep("verified");
    } catch (e) {
      setVerifyError(e instanceof Error ? e.message : "인증에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const phoneDigits = stripPhone(form.phone);
      const formattedPhone = phoneDigits ? formatPhone(phoneDigits) : null;

      // 전화번호를 입력했으면 인증 필요
      if (formattedPhone && verifyStep !== "verified") {
        setError("전화번호 인증을 완료해주세요.");
        setSaving(false);
        return;
      }

      const payload: Record<string, unknown> = {
        name: form.name || null,
        phone: formattedPhone,
        city: form.city || null,
        district: form.district || null,
        position: form.position || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        bio: form.bio || null,
        profile_completed: true,
      };

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const inp =
    "w-full rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1B3C87] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[#6B7280]";

  return (
    <div className="mx-auto max-w-lg py-8">
      {/* 환영 메시지 */}
      <div className="mb-8 text-center">
        <div className="mb-3 text-4xl">🏀</div>
        <h1 className="text-2xl font-bold text-[#111827]">환영합니다!</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          프로필을 완성하면 더 나은 경험을 제공해드릴 수 있어요.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-[12px] bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</div>
      )}

      {/* 기본 정보 */}
      <div className="mb-6 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        <h2 className="mb-4 font-semibold text-[#111827]">기본 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>이름 (실명)</label>
            <input
              className={inp}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="홍길동"
            />
          </div>

          {/* 전화번호 + 인증 */}
          <div>
            <label className={lbl}>전화번호</label>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                className={`flex-1 rounded-[16px] border bg-[#FFFFFF] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1B3C87] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/20 text-sm ${
                  verifyStep === "verified" ? "border-emerald-400" : "border-[#E8ECF0]"
                }`}
                value={form.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="01012345678"
                disabled={verifyStep === "verified"}
              />
              {verifyStep !== "verified" && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || stripPhone(form.phone).length < 10}
                  className="flex-shrink-0 rounded-[16px] bg-[#1B3C87] px-4 py-3 text-sm font-medium text-white hover:bg-[#142D6B] disabled:opacity-50"
                >
                  {sendingCode ? "발송 중..." : verifyStep === "sent" ? "재발송" : "인증요청"}
                </button>
              )}
            </div>
            {verifyStep === "verified" && (
              <p className="mt-1 px-1 text-xs text-emerald-500">인증 완료</p>
            )}
          </div>

          {/* 인증번호 입력 */}
          {verifyStep === "sent" && (
            <div>
              <label className={lbl}>인증번호</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="flex-1 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] px-4 py-3 text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#1B3C87] focus:outline-none focus:ring-2 focus:ring-[#1B3C87]/20 text-sm"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="인증번호 6자리"
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCode.length < 4}
                  className="flex-shrink-0 rounded-[16px] bg-[#E31B23] px-4 py-3 text-sm font-medium text-white hover:bg-[#C8101E] disabled:opacity-50"
                >
                  확인
                </button>
              </div>
              {verifyError && <p className="mt-1 px-1 text-xs text-red-500">{verifyError}</p>}
            </div>
          )}

          {verifyStep === "idle" && verifyError && (
            <p className="px-1 text-xs text-red-500">{verifyError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>활동 지역</label>
              <select
                className={inp}
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              >
                <option value="">시/도 선택</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>세부 지역</label>
              <input
                className={inp}
                value={form.district}
                onChange={(e) => setForm((p) => ({ ...p, district: e.target.value }))}
                placeholder="구/군"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 경기 정보 */}
      <div className="mb-6 rounded-[20px] border border-[#E8ECF0] bg-[#FFFFFF] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
        <h2 className="mb-4 font-semibold text-[#111827]">경기 정보</h2>
        <div className="space-y-4">
          <div>
            <label className={lbl}>포지션</label>
            <div className="flex gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, position: p.position === pos ? "" : pos }))}
                  className={`flex-1 rounded-full border py-2 text-sm font-medium transition-colors ${
                    form.position === pos
                      ? "border-[#1B3C87] bg-[rgba(27,60,135,0.12)] text-[#1B3C87]"
                      : "border-[#E8ECF0] text-[#6B7280] hover:border-[#1B3C87]"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>키 (cm)</label>
              <input
                type="number"
                className={inp}
                value={form.height}
                onChange={(e) => setForm((p) => ({ ...p, height: e.target.value }))}
                placeholder="예: 180"
                min={100}
                max={250}
              />
            </div>
            <div>
              <label className={lbl}>몸무게 (kg)</label>
              <input
                type="number"
                className={inp}
                value={form.weight}
                onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
                placeholder="예: 75"
                min={30}
                max={200}
              />
            </div>
          </div>
          <div>
            <label className={lbl}>자기소개</label>
            <textarea
              className={inp}
              rows={3}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="간단한 자기소개 (최대 255자)"
              maxLength={255}
            />
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-full bg-[#1B3C87] py-4 text-sm font-semibold text-white hover:bg-[#142D6B] disabled:opacity-60"
        >
          {saving ? "저장 중..." : "프로필 저장하고 시작하기"}
        </button>
        <button
          onClick={() => router.push("/")}
          className="w-full rounded-full border border-[#E8ECF0] py-4 text-sm font-medium text-[#6B7280] hover:bg-[#F5F7FA]"
        >
          나중에 할게요
        </button>
      </div>

      <div className="h-6" />
    </div>
  );
}
