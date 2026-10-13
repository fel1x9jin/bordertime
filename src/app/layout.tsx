import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BorderTime 机场边检排队时间",
  description: "旅客自己报告的机场出入境边检排队耗时，不是官方实时数据。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-screen bg-mist font-body text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
