"use client";

import { useState } from "react";
import { Check, Copy, Plus } from "lucide-react";
import { formatBytes } from "@/lib/file-utils";
import { FileGlyph, FileTypeLabel } from "@/components/FileGlyph";

export function ShareResult({
  shareUrl,
  fileName,
  size,
  expiresAt,
  onReset,
}: {
  shareUrl: string;
  fileName: string;
  size: number;
  expiresAt: string | null;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section className="space-y-6" aria-live="polite">
      <div className="rounded-3xl border border-success/30 bg-success/10 px-5 py-4 text-success">
        <p className="font-semibold">File uploaded successfully</p>
        <p className="mt-1 text-sm text-ink/80">Share this link</p>
      </div>

      <div className="flex items-start gap-4">
        <FileGlyph fileName={fileName} />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{fileName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <FileTypeLabel fileName={fileName} />
            <span>{formatBytes(size)}</span>
            <span>
              {expiresAt
                ? `Expires ${new Date(expiresAt).toLocaleString()}`
                : "Does not expire"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-5 font-semibold text-accent-ink transition hover:brightness-95"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line px-5 font-semibold text-ink transition hover:bg-surface-2"
        >
          <Plus className="h-4 w-4" />
          Upload Another File
        </button>
      </div>

      <p className="break-all rounded-2xl border border-line bg-bg-soft px-4 py-3 text-sm text-muted">
        {shareUrl}
      </p>
    </section>
  );
}
