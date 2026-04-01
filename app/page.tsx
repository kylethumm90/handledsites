import SignupForm from "@/components/SignupForm";
import FeatureCards from "@/components/FeatureCards";
import IncludedChecklist from "@/components/IncludedChecklist";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="px-6 pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center md:mb-16 md:text-left">
            <p className="mb-3 text-sm font-medium tracking-wide text-gray-500">
              FREE FOR INDEPENDENT CONTRACTORS
            </p>
            <h1
              className="mb-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Your business card,
              <br />
              on the internet.
            </h1>
            <p className="mx-auto max-w-xl text-lg text-gray-600 md:mx-0">
              Create a free mobile business card website in 60 seconds. Get
              found by AI search engines, convert visitors to calls, and share
              your link anywhere.
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
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} handled.sites. Free forever for
            independent contractors.
          </p>
        </div>
      </footer>
    </main>
  );
}
