"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * 비밀번호 재설정 페이지
 * - URL 쿼리의 token 파라미터를 사용하여 새 비밀번호를 설정한다.
 * - 비밀번호 확인 필드로 오타를 방지한다.
 */
export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 최소 길이 확인
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "비밀번호 변경에 실패했습니다.");
      }

      setSuccess(true);
      // 3초 후 로그인 페이지로 이동
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const inp =
    "w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2";

  // 토큰이 없으면 안내 메시지
  if (!token) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <span
            className="material-symbols-outlined mb-2 text-4xl"
            style={{ color: "var(--color-error)" }}
          >
            error
          </span>
          <h1
            className="mb-2 text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            잘못된 접근입니다
          </h1>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            비밀번호 재설정 링크가 유효하지 않습니다.
          </p>
          <Link
            href="/forgot-password"
            className="text-sm font-medium underline"
            style={{ color: "var(--color-primary)" }}
          >
            비밀번호 찾기로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 성공 화면
  if (success) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <span
            className="material-symbols-outlined mb-2 text-4xl"
            style={{ color: "var(--color-success, #22C55E)" }}
          >
            check_circle
          </span>
          <h1
            className="mb-2 text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            비밀번호가 변경되었습니다
          </h1>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            잠시 후 로그인 페이지로 이동합니다...
          </p>
          <Link
            href="/login"
            className="text-sm font-medium underline"
            style={{ color: "var(--color-primary)" }}
          >
            바로 로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <span
            className="material-symbols-outlined mb-2 text-4xl"
            style={{ color: "var(--color-primary)" }}
          >
            lock
          </span>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}
          >
            새 비밀번호 설정
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            새로운 비밀번호를 입력해주세요. (8자 이상)
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div
            className="mb-4 rounded-[12px] px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}
          >
            {error}
          </div>
        )}

        {/* 비밀번호 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--color-text-muted)" }}>
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
                className={inp}
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text-primary)",
                  paddingRight: "3rem",
                }}
              />
              {/* 비밀번호 표시/숨기기 토글 */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm" style={{ color: "var(--color-text-muted)" }}>
              비밀번호 확인
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호 다시 입력"
              className={inp}
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[12px] py-3 text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
