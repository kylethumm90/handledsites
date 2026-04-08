import OnboardingWizard from "@/components/OnboardingWizard";
import FeatureCards from "@/components/FeatureCards";
import IncludedChecklist from "@/components/IncludedChecklist";
import SiteNav from "@/components/SiteNav";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const siteCount = count ?? 0;
  return (
    <main className="min-h-screen bg-white">
      <SiteNav />

      {/* Hero section */}
      <section className="px-6 pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center md:mb-16 md:text-left">
            <p className="mb-3 text-sm font-semibold tracking-wide text-gray-900/60">
              FREE FOR INDEPENDENT CONTRACTORS
            </p>
            <h1
              className="mb-5 text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
            >
              More calls. Five minutes. Free.
            </h1>
            <p className="mx-auto max-w-xl text-xl font-medium text-gray-600 md:mx-0">
              A mobile business page with tap-to-call, your services, and a QR
              code you can share anywhere. Built for contractors. Free forever.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <a
                href="#get-started"
                className="inline-block rounded-full bg-gray-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/25"
              >
                Create Your Free Page &rarr;
              </a>
              <span className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex -space-x-1">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600 ring-2 ring-white">JR</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600 ring-2 ring-white">MT</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-600 ring-2 ring-white">KS</span>
                </span>
                <strong className="text-gray-900">{siteCount}</strong> sites built for contractors
              </span>
            </div>
          </div>

          {/* Onboarding wizard + live preview */}
          <div id="get-started">
            <OnboardingWizard />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <FeatureCards />

      {/* Included checklist */}
      <IncludedChecklist />

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <img src="/logo-dark.png" alt="handled." className="h-5 w-auto" />
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} handled.sites. Free forever for
            independent contractors.
          </p>
        </div>
      </footer>
    </main>
  );
}
