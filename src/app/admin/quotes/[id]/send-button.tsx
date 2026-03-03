'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendQuoteAction } from "@/app/actions/quotes";

export function SendQuoteButton({ quoteId }: { quoteId: number }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    await sendQuoteAction(quoteId);
    router.refresh();
    setSending(false);
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      style={{ padding: "8px 18px", borderRadius: 8, background: sending ? "#9ca3af" : "#f97316", color: "white", border: "none", fontWeight: 700, fontSize: 13, cursor: sending ? "not-allowed" : "pointer" }}
    >
      {sending ? "Sending…" : "💌 Send to Customer"}
    </button>
  );
}
