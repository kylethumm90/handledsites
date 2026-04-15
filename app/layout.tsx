import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://handledsites.com"),
  title: "handled.sites — Free Business Cards for Home Service Contractors",
  description:
    "Create a free mobile business card website for your home service business. Get found by AI search, convert visitors to calls, and share anywhere.",
  icons: {
    icon: "/handled-favicon.png",
  },
  openGraph: {
    title: "handled.sites — Free Business Cards for Home Service Contractors",
    description:
      "Create a free mobile business card website for your home service business. Get found by AI search, convert visitors to calls, and share anywhere.",
    url: "https://handledsites.com",
    siteName: "handled.sites",
    images: [{ url: "/api/og/home", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "handled.sites — Free Business Cards for Home Service Contractors",
    description:
      "Create a free mobile business card website for your home service business. Get found by AI search, convert visitors to calls, and share anywhere.",
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
