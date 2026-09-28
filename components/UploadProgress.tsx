export function UploadProgress({
  percent,
  status,
}: {
  percent: number;
  status: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <p className="text-muted">{status}</p>
        <p className="tabular-nums text-ink">{Math.round(clamped)}%</p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label="Upload progress"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
