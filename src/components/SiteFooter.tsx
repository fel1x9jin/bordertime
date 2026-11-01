export default function SiteFooter() {
  return (
    <footer className="bg-ink text-slate-300">
      <div className="h-1.5 bg-sign" aria-hidden="true" />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-display text-4xl font-bold leading-none text-white">BorderTime</p>
            <p className="mt-2 text-sm text-sign">旅客众包的机场边检排队时间</p>
          </div>
          <p className="text-sm text-slate-400">非官方 · 非商业</p>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold text-sign">关于 BorderTime</h2>
            <p className="mt-3 text-sm leading-relaxed">
              {"BorderTime 是旅客自愿共享信息的非官方、非商业小项目。这里的时间都是旅客自己报告的排队耗时，不是官方数据，也不保证准确，请不要以它为准安排行程。"}
            </p>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-sign">隐私说明</h2>
            <p className="mt-3 text-sm leading-relaxed">
              {"我们不要求注册，不收集姓名、邮箱或账号。排队报告只保存机场、方向、耗时、拥挤程度和提交时间。现场动态还会保存一句短文字、可选昵称，以及你上传的照片或短视频。这些内容都是公开可见的，且不会关联到你个人。请不要上传证件、登机牌或他人的清晰正脸。为防止恶意刷数据，服务器会临时保存一个经过加盐处理、无法还原成真实网络地址的标识，保留不超过 24 小时。计时进度只保存在你自己的浏览器里。网站托管服务（Vercel）和数据库服务（Supabase）可能按各自的政策记录基础访问日志。"}
            </p>
          </section>
        </div>
      </div>
    </footer>
  );
}
