/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许同一局域网内的手机访问开发服务器（见 README 的手机预览说明）
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
