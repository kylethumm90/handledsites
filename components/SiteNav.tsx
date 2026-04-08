import Link from "next/link";

export default function SiteNav() {
  return (
    <nav className="px-6 pt-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/">
          <img src="/logo-dark.png" alt="handled." className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-gray-500 hover:text-gray-900 sm:inline-block"
          >
            Pricing
          </Link>
          <Link
            href="/tools/review-link-generator"
            className="hidden text-sm font-medium text-gray-500 hover:text-gray-900 sm:inline-block"
          >
            Tools
          </Link>
          <Link
            href="/contractor/login"
            className="text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/#get-started"
            className="hidden rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 sm:inline-block"
          >
            Create Free Page
          </Link>
        </div>
      </div>
    </nav>
  );
}
