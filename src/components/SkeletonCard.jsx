export default function SkeletonCard() {
  return (
    <div className="sh-panel animate-pulse overflow-hidden">
      <div className="aspect-[16/10] w-full bg-[#EBEEF4] dark:bg-ink-subtle" />
      <div className="space-y-2.5 p-4">
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-[#EBEEF4] dark:bg-ink-subtle" />
          <div className="h-4 w-28 rounded-full bg-[#EBEEF4] dark:bg-ink-subtle" />
        </div>
        <div className="h-3.5 w-36 rounded bg-[#EBEEF4] dark:bg-ink-subtle" />
        <div className="h-6 w-3/4 rounded bg-[#EBEEF4] dark:bg-ink-subtle" />
        <div className="flex justify-between border-t border-[#ECEFF4] pt-3 dark:border-ink-line">
          <div className="h-7 w-32 rounded-lg bg-[#EBEEF4] dark:bg-ink-subtle" />
          <div className="h-7 w-16 rounded-lg bg-[#EBEEF4] dark:bg-ink-subtle" />
        </div>
      </div>
    </div>
  );
}
