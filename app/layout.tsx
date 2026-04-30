import type { Metadata, Viewport } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://handledsites.com"),
  title: "handled. — Founding Partner Pilot",
  description:
    "Looking for 15 home service contractors to test the future of their front office. Free for 90 days.",
  icons: {
    icon: "/handled-favicon.png",
  },
  openGraph: {
    title: "handled. — Founding Partner Pilot",
    description:
      "Looking for 15 home service contractors to test the future of their front office. Free for 90 days.",
    url: "https://handledsites.com",
    siteName: "handled.",
    images: [{ url: "/api/og/home", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "handled. — Founding Partner Pilot",
    description:
      "Looking for 15 home service contractors to test the future of their front office. Free for 90 days.",
    images: ["/api/og/home"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
