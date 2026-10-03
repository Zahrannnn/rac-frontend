import type { Metadata, Viewport } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { env } from "@/shared/config/env";
import { PwaRegistration } from "@/shared/components/pwa-registration";

// Cairo covers Arabic + Latin so RTL/LTR switching never changes the type system (DESIGN.md).
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "منصة التقييم والمتابعة الرقمية لقطاع التبريد والتكييف — RAC Digital Assessment & Monitoring Platform (UNIDO / NOU / EED).",
  openGraph: {
    title: env.NEXT_PUBLIC_APP_NAME,
    description:
      "Bilingual (Arabic RTL / English) M&E platform for Egypt's refrigeration & air-conditioning servicing sector.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: env.NEXT_PUBLIC_APP_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

// Navy shell from DESIGN.md — tints the browser UI / PWA chrome on both platforms.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#004E77",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning on body: browser extensions (translate/skin
          tools) inject attributes before hydration — attribute-level noise only. */}
      <body className="min-h-full" suppressHydrationWarning>
        <Script src="/runtime-env.js" strategy="beforeInteractive" />
        <Providers>{children}</Providers>
        <PwaRegistration />
      </body>
    </html>
  );
}
