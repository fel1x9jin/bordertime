import { isSupabaseConfigured } from "@/lib/supabase";

export default function DataNotice() {
  return (
    <p className="border-l-4 border-sign bg-white px-4 py-3 text-sm leading-relaxed">
      {isSupabaseConfigured
        ? "这里的时间都是旅客自己提交的排队耗时，不是官方验证的实时数据。目前报告还很少，没有报告的机场会显示「暂无数据」。"
        : "目前是本地演示模式，使用模拟数据：标有「模拟示例」的报告不是真实旅客提交的。所有时间都是旅客自己报告的排队耗时，不是官方验证的实时数据。"}
    </p>
  );
}
