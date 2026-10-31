import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-3xl bg-white px-6 py-10 shadow-card ring-1 ring-black/[0.04] sm:px-10">
        <p className="text-sm font-semibold tracking-wide text-board">BorderTime</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
          没有找到这个机场
        </h1>
        <p className="mt-3 leading-relaxed text-slate-700">
          请回到机场列表，用三字码或城市名搜索。
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-sign px-6 font-semibold text-ink"
        >
          返回机场列表
        </Link>
      </div>
    </main>
  );
}
