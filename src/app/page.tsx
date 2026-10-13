import AirportBoard from "@/components/AirportBoard";
import DataNotice from "@/components/DataNotice";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:pt-12">
      <header className="mb-6">
        <h1 className="font-display text-5xl font-bold leading-none sm:text-6xl">
          BorderTime
        </h1>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-slate-700">
          旅客自己记录、自己分享的机场边检排队时间。出发前看一眼，
          通过边检后也记一笔，帮后面的人少排一会儿。
        </p>
      </header>
      <div className="mb-6">
        <DataNotice />
      </div>
      <AirportBoard />
    </main>
  );
}
