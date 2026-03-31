"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * 비밀번호 찾기 페이지
 * - 이메일을 입력하면 재설정 토큰을 생성한다.
 * - 개발 환경에서는 토큰이 응답에 포함되어 바로 재설정 페이지로 이동할 수 있다.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // 개발용: API 응답에 포함된 토큰을 보여준다
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevToken("");

    try {
      const res = await fetch("/api/web/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "요청에 실패했습니다.");
      }

      setMessage(data.message);
      // 개발 환경에서 토큰이 응답에 포함된 경우
      if (data.reset_token) {
        setDevToken(data.reset_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 공통 입력 필드 스타일
  const inp =
    "w-full rounded-[12px] border px-4 py-3 text-sm focus:outline-none focus:ring-2";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 헤더 */}
        <div className="mb-6 text-center">
          <span
            className="material-symbols-outlined mb-2 text-4xl"
            style={{ color: "var(--color-primary)" }}
          >
            lock_reset
          </span>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-heading)" }}
          >
            비밀번호 찾기
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
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

        {/* 성공 메시지 */}
        {message && (
          <div
            className="mb-4 rounded-[12px] px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--color-success, #22C55E)" }}
          >
            {message}
          </div>
        )}

        {/* 개발용: 토큰 직접 표시 + 재설정 페이지 링크 */}
        {devToken && (
          <div
            className="mb-4 rounded-[12px] px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(0,121,185,0.1)", color: "var(--color-info, #0079B9)" }}
          >
            <p className="mb-2 font-medium">[개발용] 재설정 토큰:</p>
            <p className="break-all text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {devToken}
            </p>
            <Link
              href={`/reset-password?token=${devToken}`}
              className="mt-2 inline-block text-sm font-medium underline"
              style={{ color: "var(--color-primary)" }}
            >
              비밀번호 재설정 페이지로 이동
            </Link>
          </div>
        )}

        {/* 이메일 입력 폼 */}
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="mb-1 block text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                이메일
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
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
              {loading ? "전송 중..." : "재설정 링크 받기"}
            </button>
          </form>
        )}

        {/* 로그인으로 돌아가기 */}
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
