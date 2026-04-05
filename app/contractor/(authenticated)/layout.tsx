"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const TABS = [
  { label: "Dashboard", href: "/contractor/dashboard" },
  { label: "Customers", href: "/contractor/customers" },
  { label: "Business Info", href: "/contractor/business" },
  { label: "Sites", href: "/contractor/sites" },
  { label: "Settings", href: "/contractor/settings" },
];

export default function ContractorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-bold text-gray-900">
            handled<span className="text-gray-400">.sites</span>
          </span>
          <LogoutButton />
        </div>
      </nav>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-3xl overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-4">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex-shrink-0 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                    isActive
                      ? "border-b-2 border-gray-900 text-gray-900"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
