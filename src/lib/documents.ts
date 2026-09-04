export const DOCUMENT_BUCKET = "client-documents";
export const MAX_DOCUMENT_BYTES = 750 * 1024;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function documentObjectName(id: string, filename: string) {
  const base = filename.replace(/\.pdf$/i, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[^a-zA-Z0-9]+/, "").slice(0, 100) || "document";
  return `${id}--${base}.pdf`;
}
export function validDocumentObject(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}--[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.pdf$/.test(value);
}
export async function validateDocument(value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File) || !value.size) return "Choose a PDF document.";
  if (value.size > MAX_DOCUMENT_BYTES) return "Choose a PDF smaller than 750 KB.";
  if (!/\.pdf$/i.test(value.name) || value.type !== "application/pdf") return "Only PDF documents are accepted.";
  const header = await value.slice(0, 5).text();
  if (header !== "%PDF-") return "This file does not have a PDF header. Choose a valid PDF.";
  // Signature checking is not parsing or malware scanning.
  return null;
}
