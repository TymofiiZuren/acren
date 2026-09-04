"use client";

import { useState } from "react";

export function CopyDetail({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function copy() {
    setPending(true);
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copy unavailable. Select the detail above and copy it manually.");
    } finally {
      setPending(false);
    }
  }
  return <div className="space-y-1"><button type="button" className="button-quiet" disabled={pending} onClick={copy}>{pending ? "Copying…" : `Copy ${label.toLowerCase()}`}</button><p role="status" className="text-xs leading-5 text-stone-600">{message}</p></div>;
}
