import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "handled.sites — Free Business Cards for Home Service Contractors",
  description:
    "Create a free mobile business card website for your home service business. Get found by AI search, convert visitors to calls, and share anywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
