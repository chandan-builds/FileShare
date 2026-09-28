import type { ReactNode } from "react";
import { DownloadCard } from "@/components/DownloadCard";
import { SiteHeader } from "@/components/SiteHeader";
import { AppError } from "@/lib/errors";
import { getShareMetadata, headObject } from "@/lib/r2";
import { purgeExpiredShare, toPublicShareInfo } from "@/lib/share";
import { SHARE_ID_PATTERN, isExpired } from "@/lib/validation";

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;

  if (!SHARE_ID_PATTERN.test(shareId)) {
    return (
      <ShareShell>
        <MissingCard title="This share link is invalid." body="The link format is not recognized." />
      </ShareShell>
    );
  }

  try {
    const metadata = await getShareMetadata(shareId);
    const publicShare = toPublicShareInfo(metadata);

    if (isExpired(metadata.expiresAt) || publicShare.expired) {
      await purgeExpiredShare(metadata);
      return (
        <ShareShell>
          <DownloadCard share={{ ...publicShare, expired: true }} />
        </ShareShell>
      );
    }

    await headObject(metadata.objectKey);
    return (
      <ShareShell>
        <DownloadCard share={publicShare} />
      </ShareShell>
    );
  } catch (error) {
    if (error instanceof AppError && error.code === "FILE_NOT_FOUND") {
      return (
        <ShareShell>
          <MissingCard title="This file is no longer available." body="It may have been deleted from storage." />
        </ShareShell>
      );
    }
    if (error instanceof AppError && error.code === "METADATA_MISSING") {
      return (
        <ShareShell>
          <MissingCard title="This share link is invalid." body="No file is associated with this URL." />
        </ShareShell>
      );
    }
    return (
      <ShareShell>
        <MissingCard title="This file could not be loaded." body="Please try again in a moment." />
      </ShareShell>
    );
  }
}

function ShareShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <SiteHeader />
      <main className="flex flex-1 flex-col justify-center py-10">{children}</main>
    </div>
  );
}

function MissingCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[2rem] border border-line bg-surface p-8 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <a
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-6 font-semibold text-accent-ink"
      >
        Back to FileShare
      </a>
    </section>
  );
}
