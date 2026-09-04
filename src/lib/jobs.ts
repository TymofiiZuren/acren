export type JobStatus = "planned" | "in_progress" | "completed" | "cancelled";
export const jobLabels: Record<JobStatus, string> = {
  planned: "Planned", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled",
};
export const jobTransitions: Record<JobStatus, JobStatus[]> = {
  planned: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"],
  completed: ["in_progress"], cancelled: ["planned"],
};
export type JobInput = { title: string; target_date: string | null };
export type JobErrors = Partial<Record<keyof JobInput, string>>;
export function parseJobInput(form: FormData) {
  const title = form.get("title");
  const date = form.get("target_date");
  const values: JobInput = {
    title: typeof title === "string" ? title.trim() : "",
    target_date: typeof date === "string" && date ? date : null,
  };
  const errors: JobErrors = {};
  if (!values.title || values.title.length > 120) errors.title = "Enter a job title of 1–120 characters.";
  if (date !== null && typeof date !== "string") errors.target_date = "Enter a valid target date.";
  if (values.target_date) {
    const value = values.target_date;
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "2000-01-01" || value > "2100-12-31" ||
      !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      errors.target_date = "Enter a real date between 2000 and 2100.";
    }
  }
  return { ok: Object.keys(errors).length === 0, values, errors };
}
export function parseJobPage(value?: string) {
  return value && /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10000 ? Number(value) : 1;
}
