import { flagMarkup } from "@/lib/flags";
import type { CountryCode } from "@/lib/types";

export default function CountryFlag({
  code,
  label,
  decorative = false,
}: {
  code: CountryCode;
  label: string;
  /** 同一处已经写出国名时设为 true，避免读屏把国家读两遍。 */
  decorative?: boolean;
}) {
  return (
    <span
      className="airport-flag"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      title={label}
      dangerouslySetInnerHTML={{ __html: flagMarkup(code) }}
    />
  );
}
