import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-16">
      <h1 className="font-display text-4xl font-bold">没有找到这个机场</h1>
      <p className="mt-3 text-slate-700">请回到机场列表，用三字码或城市名搜索。</p>
      <Link href="/" className="mt-6 inline-block underline underline-offset-4">
        返回机场列表
      </Link>
    </main>
  );
}
