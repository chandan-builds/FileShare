const FALLBACK_CONTENT_TYPE = "application/octet-stream";

export function getFileExtension(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? "";
  const parts = base.split(".");
  if (parts.length < 2) return "";
  return parts.pop()?.toLowerCase() ?? "";
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.replace(/\\/g, "/").split("/").pop() || "file";
  const withoutControl = base.replace(/[\u0000-\u001f\u007f]/g, "");
  const cleaned = withoutControl
    .replace(/[^\w.\- ()[\]]+/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .trim();

  const truncated = cleaned.slice(0, 120);
  return truncated || "file";
}

export function buildObjectKey(shareId: string, originalFileName: string): string {
  const safeName = sanitizeFileName(originalFileName);
  return `files/${shareId}/${Date.now()}-${safeName}`;
}

export function metadataKey(shareId: string): string {
  return `metadata/${shareId}.json`;
}

export function isSafeObjectKey(objectKey: string): boolean {
  if (!objectKey || objectKey.includes("..") || objectKey.startsWith("/")) {
    return false;
  }
  return objectKey.startsWith("files/") || objectKey.startsWith("metadata/");
}

export function normalizeContentType(contentType: string | undefined): string {
  const trimmed = contentType?.split(";")[0]?.trim().toLowerCase();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return FALLBACK_CONTENT_TYPE;
  }
  return trimmed;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

export function formatUploadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export { FALLBACK_CONTENT_TYPE };
