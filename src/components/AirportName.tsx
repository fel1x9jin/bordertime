import type { Airport } from "@/lib/types";
import CountryFlag from "./CountryFlag";

export default function AirportName({
  airport,
  field = "nameZh",
  decorative = false,
}: {
  airport: Airport;
  field?: "name" | "nameZh";
  decorative?: boolean;
}) {
  return (
    <span>
      {airport[field]}
      <CountryFlag code={airport.countryCode} label={airport.countryZh} decorative={decorative} />
    </span>
  );
}
