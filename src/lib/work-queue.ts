import type { JobStatus } from "./jobs";
export const workFilters = { open: "Open work", all: "All jobs", planned: "Planned", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", overdue: "Overdue targets" };
export type WorkFilter = keyof typeof workFilters;
export function parseWorkFilter(value: unknown): WorkFilter {
  return typeof value === "string" && Object.hasOwn(workFilters, value) ? value as WorkFilter : "open";
}
export function irelandToday(now: Date) {
  const parts = new Intl.DateTimeFormat("en-IE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Dublin" }).formatToParts(now);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)!.value).join("-");
}
export function isOverdue(status: JobStatus, target: string | null, today: string) {
  return (status === "planned" || status === "in_progress") && target !== null && target < today;
}
