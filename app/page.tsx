import { FileUploader } from "@/components/FileUploader";
import { SiteHeader } from "@/components/SiteHeader";
import { getMaxFileSizeMb } from "@/lib/env";

export default function HomePage() {
  const maxFileSizeMb = getMaxFileSizeMb();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <SiteHeader />
      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="text-center text-sm uppercase tracking-[0.28em] text-muted">Quiet transfers</p>
        <h1 className="mt-3 text-center font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          Share files easily
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-center text-muted">
          Drop a file, get a private link, and let anyone download it before it expires.
          Uploads stop at 9 GB total so the bucket stays on Cloudflare R2 free usage.
        </p>
        <div className="mt-10 rounded-[2rem] border border-line bg-surface p-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-8">
          <FileUploader maxFileSizeMb={maxFileSizeMb} />
        </div>
      </main>
    </div>
  );
}
