interface Props {
  minutes: number | null;
  loading?: boolean;
  size?: "sm" | "lg";
}

/** 在深蓝色看板上显示等待时间；没有数据时明确显示“暂无数据” */
export default function WaitReadout({ minutes, loading = false, size = "sm" }: Props) {
  const big = size === "lg";

  if (loading) {
    return (
      <p className={`font-display text-slate-400 ${big ? "text-5xl" : "text-2xl"}`}>
        …
      </p>
    );
  }

  if (minutes === null) {
    return (
      <p className={`font-medium text-slate-300 ${big ? "text-3xl" : "text-lg"}`}>
        暂无数据
      </p>
    );
  }

  return (
    <p className="text-sign">
      <span
        className={`font-display font-bold leading-none tabular-nums ${
          big ? "text-7xl" : "text-4xl"
        }`}
      >
        {minutes}
      </span>
      <span className={`ml-1 font-medium ${big ? "text-2xl" : "text-base"}`}>
        分钟
      </span>
    </p>
  );
}
