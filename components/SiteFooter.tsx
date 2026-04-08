export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <img src="/logo-dark.png" alt="handled." className="h-5 w-auto" />
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} handled.sites. Free forever for
          independent contractors.
        </p>
      </div>
    </footer>
  );
}
