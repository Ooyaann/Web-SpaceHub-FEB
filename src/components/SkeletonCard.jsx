export default function SkeletonCard() {
  return (
    <div className="sh-card flex animate-pulse gap-3.5 p-3.5">
      <div className="h-24 w-24 flex-none rounded-xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2.5 py-1">
        <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-5 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
