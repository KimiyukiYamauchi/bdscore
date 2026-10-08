import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// 英数字は Inter、和文は Noto Sans JP で表示する
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "BadScore",
  description: "A simple badminton scorekeeping web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJp.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
