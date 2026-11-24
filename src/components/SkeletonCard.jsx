export default function SkeletonCard() {
  return (
    <div className="sh-card animate-pulse overflow-hidden">
      <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2.5 p-3.5">
        <div className="flex justify-between">
          <div className="h-5 w-24 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-10 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
