"use client";

import { useActionState } from "react";
import { changeJobStatus, type JobFormState } from "@/app/actions/jobs";
import { jobLabels, jobTransitions, type JobStatus } from "@/lib/jobs";
import { SubmitButton } from "@/components/submit-button";

export function JobStatusForm({ clientId, jobId, status, version }: { clientId: string; jobId: string; status: JobStatus; version: number }) {
  const [state, action, pending] = useActionState<JobFormState, FormData>(changeJobStatus.bind(null, clientId, jobId, version), {});
  return <form action={action} className="space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1"><label className="field-label" htmlFor={`status-${jobId}`}>Change status</label>
        <select key={version} id={`status-${jobId}`} name="status" className="field-input" defaultValue="" required disabled={pending}>
          <option value="" disabled>Choose next status</option>
          {jobTransitions[status].map((next) => <option key={next} value={next}>{jobLabels[next]}{status === "completed" ? " (reopen)" : status === "cancelled" ? " (replan)" : ""}</option>)}
        </select>
      </div><SubmitButton className="button-secondary" pendingLabel="Saving…">Save status</SubmitButton>
    </div>
    {state.error && <p role="alert" className="alert-error">{state.error}</p>}
    {state.message && <p role="status" className="text-sm font-semibold text-emerald-800">{state.message}</p>}
  </form>;
}
