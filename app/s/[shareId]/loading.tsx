export default function LoadingSharePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl items-center justify-center px-4">
      <div className="w-full max-w-md animate-pulse rounded-[2rem] border border-line bg-surface p-10">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2" />
        <div className="mx-auto mt-6 h-8 w-48 rounded-full bg-surface-2" />
        <div className="mx-auto mt-4 h-4 w-24 rounded-full bg-surface-2" />
        <div className="mx-auto mt-8 h-12 w-40 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
