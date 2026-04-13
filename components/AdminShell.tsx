/**
 * AdminShell is now a pass-through. The admin chrome (sidebar, background,
 * max-width content container) lives in app/admin/layout.tsx so it persists
 * across route changes without remounting. This component is kept so existing
 * page files can continue to wrap their content in <AdminShell> without
 * modification; the `active` prop is ignored because the sidebar now derives
 * the active item from the URL via usePathname().
 */
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
  active?:
    | "dashboard"
    | "sites"
    | "businesses"
    | "users"
    | "pulse"
    | "landing-pages"
    | "tools"
    | "emails";
}) {
  return <>{children}</>;
}
