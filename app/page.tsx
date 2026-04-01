import SignupForm from "@/components/SignupForm";
import FeatureCards from "@/components/FeatureCards";
import IncludedChecklist from "@/components/IncludedChecklist";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="px-6 pt-6">
        <div className="mx-auto max-w-5xl">
          <img src="/logo-dark.png" alt="handled." className="h-7 w-auto" />
        </div>
      </nav>

      {/* Hero section */}
      <section className="px-6 pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center md:mb-16 md:text-left">
            <p className="mb-3 text-sm font-medium tracking-wide text-gray-500">
              FREE FOR INDEPENDENT CONTRACTORS
            </p>
            <h1
              className="mb-4 text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
            >
              You&apos;re missing jobs
              <br />
              because nobody answered.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-600 md:mx-0">
              handled.sites builds you a free website designed to turn visitors
              into phone calls. Set it up in 5 minutes. Free forever.
            </p>
          </div>

          {/* Form + Preview */}
          <SignupForm />
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
