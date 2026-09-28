export const EXPIRATION_OPTIONS = [
  { value: "1h", label: "1 hour", seconds: 60 * 60 },
  { value: "1d", label: "1 day", seconds: 60 * 60 * 24 },
  { value: "7d", label: "7 days", seconds: 60 * 60 * 24 * 7 },
  { value: "30d", label: "30 days", seconds: 60 * 60 * 24 * 30 },
  { value: "never", label: "Never", seconds: null },
] as const;

export type ExpirationValue = (typeof EXPIRATION_OPTIONS)[number]["value"];

export type ShareMetadata = {
  shareId: string;
  objectKey: string;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
};

export type PublicShareInfo = {
  shareId: string;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
};

export type UploadUrlResponse = {
  shareId: string;
  objectKey: string;
  uploadUrl: string;
  contentType: string;
  maxFileSizeBytes: number;
};

export type CompleteUploadResponse = {
  shareId: string;
  shareUrl: string;
  originalFileName: string;
  size: number;
  expiresAt: string | null;
};
