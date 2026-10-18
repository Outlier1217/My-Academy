import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import ScrollEffects from "@/components/ScrollEffects";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-newsreader", display: "swap" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Outlier Academy — Learn deeply. Think differently.", template: "%s | Outlier Academy" },
  description: "A home for curious minds — finance, mathematics, AI, blockchain, DeFi, articles, stories and practice tests.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-theme="dark" className={`${newsreader.variable} ${plexSans.variable} ${plexMono.variable}`}><body className="font-sans antialiased"><ThemeProvider><ScrollEffects />{children}</ThemeProvider></body></html>;
}
