import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AirportDetail from "@/components/AirportDetail";
import { AIRPORTS, findAirport } from "@/data/airports";

type Props = { params: Promise<{ code: string }> };

export function generateStaticParams() {
  return AIRPORTS.map((a) => ({ code: a.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const airport = findAirport(code);
  return {
    title: airport
      ? `${airport.code} ${airport.nameZh} 边检排队时间 | BorderTime`
      : "未找到机场 | BorderTime",
  };
}

export default async function AirportPage({ params }: Props) {
  const { code } = await params;
  const airport = findAirport(code);
  if (!airport) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:pt-10">
      <AirportDetail airport={airport} />
    </main>
  );
}
