"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-4xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">Please try again. If the problem continues, come back later.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
      >
        Try again
      </button>
    </div>
  );
}
