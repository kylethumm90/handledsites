"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Login page stands alone - no sidebar chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: F,
        background: "linear-gradient(180deg, #f5f5f7 0%, #fbfbfd 40%, #f5f5f7 100%)",
      }}
    >
      <AdminSidebar />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 24px 48px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
