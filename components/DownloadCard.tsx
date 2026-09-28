"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { FileGlyph, FileTypeLabel } from "@/components/FileGlyph";
import { formatBytes, formatUploadDate } from "@/lib/file-utils";
import type { PublicShareInfo } from "@/types/file";

export function DownloadCard({ share }: { share: PublicShareInfo }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/download/${share.shareId}`);
      const payload = (await response.json()) as { downloadUrl?: string; error?: string };
      if (!response.ok || !payload.downloadUrl) {
        throw new Error(payload.error || "Download is unavailable.");
      }
      window.location.assign(payload.downloadUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  if (share.expired) {
    return (
      <section className="rounded-[2rem] border border-danger/30 bg-surface p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
        <p className="font-display text-3xl font-bold">This file has expired.</p>
        <p className="mt-3 text-muted">The share link is no longer available for download.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)] sm:p-10">
      <div className="flex flex-col items-center text-center">
        <FileGlyph fileName={share.originalFileName} contentType={share.contentType} />
        <h1 className="mt-5 max-w-full break-all font-display text-3xl font-bold sm:text-4xl">
          {share.originalFileName}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-muted">
          <FileTypeLabel fileName={share.originalFileName} />
          <span className="text-lg tabular-nums text-ink">{formatBytes(share.size)}</span>
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.18em] text-muted">Uploaded</p>
        <p className="mt-1 text-lg">{formatUploadDate(share.createdAt)}</p>
        <p className="mt-2 text-sm text-muted">
          {share.expiresAt
            ? `Expires ${formatUploadDate(share.expiresAt)}`
            : "This file has expired"}
        </p>
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="mt-8 inline-flex min-h-12 min-w-48 items-center justify-center gap-2 rounded-2xl bg-accent px-8 font-semibold text-accent-ink transition hover:brightness-95 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {busy ? "Preparing…" : "Download"}
        </button>
        <p className="mt-4 text-sm text-muted">Link expires automatically</p>
        {error ? (
          <p className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
