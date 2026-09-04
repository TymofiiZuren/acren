"use client";

import Link from "next/link";

export default function WorkspaceError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl space-y-5 px-5 py-16"><p className="eyebrow">Let’s try that again</p><h1 className="text-3xl font-medium">We couldn’t complete that request.</h1><p className="leading-7 text-stone-600">Check your connection and try again. If you were saving changes, check the client record before submitting again.</p><div className="flex flex-wrap gap-3"><button className="button-primary" onClick={reset}>Try again</button><Link className="button-secondary" href="/clients">Back to client book</Link></div></div>;
}
