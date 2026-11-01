export default function AirportActivity({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 8.5h3.1l1.2-2h6.4l1.2 2h3.1v9.2a1.5 1.5 0 0 1-1.5 1.5h-12a1.5 1.5 0 0 1-1.5-1.5V8.5z"
        />
        <circle cx="12" cy="13.2" r="2.5" />
      </svg>
      <span>
        近 3 小时 <span className="tabular-nums text-ink">{count}</span> 条现场动态
      </span>
    </p>
  );
}
