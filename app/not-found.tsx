import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="font-display text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted">That URL does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
        >
          Back to FileShare
        </Link>
      </main>
    </div>
  );
}
