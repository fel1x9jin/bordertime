"use client";

import { useEffect, useState } from "react";
import type { Crowd } from "@/lib/types";
import CrowdPicker from "./CrowdPicker";

interface Props {
  onSubmit: (crowd: Crowd) => Promise<boolean>;
}

/** 不计时，只提交“现在大概有多挤” */
export default function CrowdForm({ onSubmit }: Props) {
  const [crowd, setCrowd] = useState<Crowd | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "done" | "failed">("idle");

  // 成功提示 6 秒后自动消失
  useEffect(() => {
    if (status !== "done") return;
    const id = setTimeout(() => setStatus("idle"), 6000);
    return () => clearTimeout(id);
  }, [status]);

  async function handleSubmit() {
    if (!crowd || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit(crowd);
    setSubmitting(false);
    if (ok) {
      setCrowd(null);
      setStatus("done");
    } else {
      setStatus("failed");
    }
  }

  return (
    <div className="space-y-3">
      <CrowdPicker
        value={crowd}
        onChange={(value) => {
          setCrowd(value);
          setStatus("idle");
        }}
      />
      <button
        type="button"
        disabled={!crowd || submitting}
        onClick={handleSubmit}
        className="min-h-12 w-full bg-board px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
      >
        {submitting ? "提交中…" : "提交拥挤程度"}
      </button>
      {status === "done" && (
        <p role="status" className="text-sm text-ok">
          已提交，谢谢你的报告。
        </p>
      )}
      {status === "failed" && (
        <p role="alert" className="text-sm text-bad">
          提交失败，网络或服务器暂时有问题，请稍后再试。
        </p>
      )}
    </div>
  );
}
