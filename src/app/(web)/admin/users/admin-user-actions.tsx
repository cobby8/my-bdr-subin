"use client";

import { useState } from "react";

interface Props {
  userId: string;
  nickname: string;
  isWithdrawn: boolean;
  forceWithdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminUserActions({ userId, nickname, isWithdrawn, forceWithdrawAction, deleteAction }: Props) {
  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);
  const [pending, setPending] = useState(false);

  const handleAction = async (action: (formData: FormData) => Promise<void>) => {
    setPending(true);
    const fd = new FormData();
    fd.set("user_id", userId);
    await action(fd);
    setPending(false);
    setConfirm(null);
  };

  if (confirm) {
    const isDelete = confirm === "delete";
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#EF4444]">
          {isDelete ? "삭제" : "탈퇴"}?
        </span>
        <button
          onClick={() => handleAction(isDelete ? deleteAction : forceWithdrawAction)}
          disabled={pending}
          className="rounded-full bg-[#EF4444] px-2 py-0.5 text-xs font-semibold text-white hover:bg-[#DC2626] disabled:opacity-50"
        >
          {pending ? "..." : "확인"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          disabled={pending}
          className="rounded-full border border-[#E8ECF0] px-2 py-0.5 text-xs text-[#6B7280] hover:bg-[#F5F7FA]"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {!isWithdrawn && (
        <button
          onClick={() => setConfirm("withdraw")}
          className="rounded-full bg-[rgba(249,115,22,0.1)] px-2 py-0.5 text-xs font-semibold text-[#F97316] hover:bg-[rgba(249,115,22,0.2)]"
        >
          강제탈퇴
        </button>
      )}
      <button
        onClick={() => setConfirm("delete")}
        className="rounded-full bg-[rgba(239,68,68,0.1)] px-2 py-0.5 text-xs font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.2)]"
      >
        삭제
      </button>
    </div>
  );
}
