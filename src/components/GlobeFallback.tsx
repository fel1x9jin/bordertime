export default function GlobeFallback({ label = "地球仪加载中" }: { label?: string }) {
  return (
    <div className="grid h-full w-full place-items-center" role="img" aria-label={label}>
      <div className="relative aspect-square h-[86%] max-h-full">
        <div className="absolute inset-x-[12%] bottom-[2%] h-[10%] rounded-[100%] bg-black/25 blur-md" />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#3d6e9e_0%,#1a4574_38%,#0d2748_70%,#08182c_100%)] shadow-[inset_-18px_-16px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,199,44,0.4)]" />
      </div>
    </div>
  );
}
