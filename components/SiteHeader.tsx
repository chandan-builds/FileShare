import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="group flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[0_0_0_1px_rgba(215,242,92,0.3)]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M7 17.5V8.8c0-2.4 1.9-4.3 4.3-4.3h.4C14.1 4.5 16 6.4 16 8.8v8.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M8.2 12.2h7.6M12 8.6v10.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="font-display text-xl font-bold tracking-tight">
          FileShare
        </span>
      </Link>
      <p className="hidden text-sm text-muted sm:block">Private transfers. Short-lived links.</p>
    </header>
  );
}
