export default function SiteFooter() {
  return (
    <footer className="mx-auto max-w-3xl border-t border-line px-4 pb-16 pt-6 text-xs leading-relaxed text-slate-600">
      <p className="font-medium text-ink">关于 BorderTime</p>
      <p className="mt-2">
        {"BorderTime 是旅客自愿共享信息的非官方、非商业小项目。这里的时间都是旅客自己报告的排队耗时，不是官方数据，也不保证准确，请不要以它为准安排行程。"}
      </p>
      <p className="mt-2 font-medium text-ink">隐私说明</p>
      <p className="mt-2">
        {"我们不要求注册，不收集姓名、邮箱或账号。提交报告时只保存机场、方向、耗时、拥挤程度和提交时间，这些报告是公开可见的，且不会关联到你个人。为防止恶意刷数据，服务器会临时保存一个经过加盐处理、无法还原成真实网络地址的标识，保留不超过 24 小时。计时进度只保存在你自己的浏览器里。网站托管服务（Vercel）和数据库服务（Supabase）可能按各自的政策记录基础访问日志。"}
      </p>
    </footer>
  );
}
