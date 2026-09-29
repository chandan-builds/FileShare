"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { FileGlyph, FileTypeLabel } from "@/components/FileGlyph";
import { ShareResult } from "@/components/ShareResult";
import { UploadProgress } from "@/components/UploadProgress";
import { formatBytes } from "@/lib/file-utils";
import {
  DEFAULT_EXPIRATION,
  EXPIRATION_OPTIONS,
  type CompleteUploadResponse,
  type ExpirationValue,
  type UploadUrlResponse,
} from "@/types/file";

type Stage = "idle" | "ready" | "uploading" | "complete" | "error";

type Props = {
  maxFileSizeMb: number;
};

function friendlyError(payload: { error?: string; code?: string }, fallback: string) {
  if (payload.error) return payload.error;
  return fallback;
}

export function FileUploader({ maxFileSizeMb }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waiting for a file");
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<ExpirationValue>(DEFAULT_EXPIRATION);
  const [result, setResult] = useState<CompleteUploadResponse | null>(null);

  const maxBytes = maxFileSizeMb * 1024 * 1024;

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setFile(null);
    setStage("idle");
    setProgress(0);
    setStatus("Waiting for a file");
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const selectFile = useCallback(
    (next: File | undefined) => {
      if (!next) return;
      setError(null);
      setResult(null);

      if (next.size > maxBytes) {
        setFile(null);
        setStage("error");
        setError(`This file is too large. The maximum size is ${maxFileSizeMb} MB.`);
        return;
      }

      if (next.size === 0) {
        setFile(null);
        setStage("error");
        setError("The selected file is empty.");
        return;
      }

      setFile(next);
      setStage("ready");
      setProgress(0);
      setStatus("Ready to upload");
    },
    [maxBytes, maxFileSizeMb],
  );

  async function upload() {
    if (!file) return;
    setStage("uploading");
    setProgress(0);
    setError(null);
    setStatus("Preparing upload");

    try {
      const urlResponse = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          expiresIn,
        }),
      });
      const urlPayload = (await urlResponse.json()) as UploadUrlResponse & {
        error?: string;
      };
      if (!urlResponse.ok) {
        throw new Error(friendlyError(urlPayload, "Could not start the upload."));
      }

      setStatus("Uploading to storage");
      await putWithProgress(urlPayload.uploadUrl, file, urlPayload.contentType, (value) => {
        setProgress(value);
      });

      setStatus("Creating share link");
      const completeResponse = await fetch("/api/complete-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareId: urlPayload.shareId,
          objectKey: urlPayload.objectKey,
          fileName: file.name,
          contentType: urlPayload.contentType,
          size: file.size,
          expiresIn,
        }),
      });
      const completePayload = (await completeResponse.json()) as CompleteUploadResponse & {
        error?: string;
      };
      if (!completeResponse.ok) {
        throw new Error(friendlyError(completePayload, "Could not create the share link."));
      }

      setResult(completePayload);
      setProgress(100);
      setStatus("Upload complete");
      setStage("complete");
    } catch (caught) {
      if ((caught as { name?: string }).name === "AbortError") {
        setStage(file ? "ready" : "idle");
        setStatus("Upload canceled");
        return;
      }
      setStage("error");
      setError(caught instanceof Error ? caught.message : "Upload failed. Check your connection and try again.");
    }
  }

  function putWithProgress(
    uploadUrl: string,
    selected: File,
    contentType: string,
    onProgress: (value: number) => void,
  ) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", contentType);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress((event.loaded / event.total) * 100);
        }
      };
      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
          return;
        }
        reject(new Error("Upload failed. Please try again."));
      };
      xhr.onerror = () => {
        xhrRef.current = null;
        reject(new Error("Network failure during upload. Please try again."));
      };
      xhr.onabort = () => {
        xhrRef.current = null;
        const abortError = new Error("Upload canceled");
        abortError.name = "AbortError";
        reject(abortError);
      };
      xhr.send(selected);
    });
  }

  function cancelUpload() {
    xhrRef.current?.abort();
    setStage(file ? "ready" : "idle");
    setProgress(0);
    setStatus("Upload canceled");
  }

  if (stage === "complete" && result) {
    return (
      <ShareResult
        shareUrl={result.shareUrl}
        fileName={result.originalFileName}
        size={result.size}
        expiresAt={result.expiresAt}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          selectFile(event.dataTransfer.files[0]);
        }}
        className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed px-6 text-center transition ${
          dragOver ? "border-accent bg-accent/10" : "border-line bg-bg-soft hover:border-accent/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-accent">
          <Upload className="h-6 w-6" />
        </span>
        <p className="mt-5 font-display text-2xl font-bold">Drop files here</p>
        <p className="mt-2 text-muted">or</p>
        <span className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-accent px-5 font-semibold text-accent-ink">
          Choose File
        </span>
        <p className="mt-4 text-sm text-muted">Any file type, up to {maxFileSizeMb} MB</p>
      </label>

      {file ? (
        <div className="flex items-start justify-between gap-4 rounded-3xl border border-line bg-surface p-4">
          <div className="flex min-w-0 items-start gap-3">
            <FileGlyph fileName={file.name} contentType={file.type} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{file.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <FileTypeLabel fileName={file.name} />
                <span>{formatBytes(file.size)}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-muted hover:text-ink"
            aria-label="Remove selected file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-muted">Link expiration</legend>
        <p className="text-sm text-muted">
          Files are deleted after the link expires. Longest option is 1 hour.
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPIRATION_OPTIONS.map((option) => {
            const selected = option.value === expiresIn;
            return (
              <label
                key={option.value}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium transition ${
                  selected
                    ? "border-accent bg-accent text-accent-ink"
                    : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="expiresIn"
                  value={option.value}
                  checked={selected}
                  onChange={() => setExpiresIn(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {stage === "uploading" ? <UploadProgress percent={progress} status={status} /> : null}

      {error ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {stage === "uploading" ? (
          <button
            type="button"
            onClick={cancelUpload}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-line px-5 font-semibold"
          >
            Cancel upload
          </button>
        ) : (
          <button
            type="button"
            onClick={upload}
            disabled={!file}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-accent px-5 font-semibold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Upload and get share link
          </button>
        )}
      </div>
    </div>
  );
}
