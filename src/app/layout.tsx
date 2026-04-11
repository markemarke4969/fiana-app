import type { Metadata } from "next";
import { Noto_Sans_JP, Orbitron, Inter } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FIANA - 投資体験シミュレーター",
  description:
    "あなたに合った投資スタイルを診断し、2週間の無料体験で資産運用を体感できます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${orbitron.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="fiana-dark fiana-body min-h-screen relative"
        style={{ background: "var(--fiana-bg)" }}
      >
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at top, rgba(99,102,241,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at bottom right, rgba(139,92,246,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at bottom left, rgba(59,130,246,0.04) 0%, transparent 40%)
            `,
          }}
        />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
