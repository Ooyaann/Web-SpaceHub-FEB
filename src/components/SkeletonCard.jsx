export default function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] w-full rounded-xl bg-[#ECEFF4] dark:bg-ink-card" />
      <div className="mt-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-[#ECEFF4] dark:bg-ink-card" />
          <div className="h-3.5 w-28 rounded bg-[#ECEFF4] dark:bg-ink-card" />
        </div>
        <div className="h-3.5 w-3/4 rounded bg-[#ECEFF4] dark:bg-ink-card" />
        <div className="h-3 w-1/2 rounded bg-[#ECEFF4] dark:bg-ink-card" />
      </div>
    </div>
  );
}
