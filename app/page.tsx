import PilotApplyForm from "@/components/PilotApplyForm";

export const dynamic = "force-dynamic";

const ACCENT = "#E08A1E";

const PILOT_SPOTS_TOTAL = 15;
const PILOT_SPOTS_OPEN = 9;
const PILOT_START = "May";

const CRITERIA: string[] = [
  "You run a 1–5 person home service business doing $200k–$2M a year.",
  "You're missing calls, forgetting follow-ups, and losing reviews because you're on a roof, not at a desk.",
  "You can't afford a $50k/year office manager and you don't want to spend $400/month on enterprise software.",
];

const FIVE_THINGS: { name: string; tag: string; body: string }[] = [
  {
    name: "Ava",
    tag: "Voice AI receptionist",
    body: "Answers every inbound call 24/7 with a voice that sounds like a real person. Qualifies leads, books appointments straight to your calendar.",
  },
  {
    name: "Stella",
    tag: "Reviews & referral agent",
    body: "Collects 5-star reviews after every job, asks for referrals when customers are happiest, reactivates dormant customers automatically.",
  },
  {
    name: "Site",
    tag: "Real website for your trade",
    body: "Quiz funnels, gallery, reviews, custom domain. Built for HVAC, roofing, or solar — not a generic SaaS template.",
  },
  {
    name: "Number",
    tag: "Business phone line",
    body: "A unique number that forwards to you when it matters and lets Ava handle the rest.",
  },
  {
    name: "Summary",
    tag: "Daily + weekly recap",
    body: "Text summaries delivered every day and week so you know exactly what got handled and what needs you.",
  },
];

const ASKS: string[] = [
  "A 30-minute kickoff call to set up your account.",
  "30-minute feedback calls at week 2, week 6, and week 10.",
  "Permission to record calls with Ava so I can keep improving her.",
  "Honest feedback. If something sucks, I need to know.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "var(--font-dm-sans), 'Inter', sans-serif" }}>
      <PilotNav />

      <Hero />

      <SectionDivider number="01" label="Who this is for" />
      <Criteria />

      <SectionDivider number="02" label="What you're getting" />
      <FiveThings />
      <ThreeMonthsBanner />

      <SectionDivider number="03" label="What I'm asking for" />
      <Asks />

      <SectionDivider number="04" label="Who I am" />
      <Bio />

      <SectionDivider number="05" label="Apply" />
      <Apply />

      <PilotFooter />
    </main>
  );
}

function PilotNav() {
  return (
    <nav className="px-6 pt-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <a href="/" className="inline-block">
          <img src="/logo-dark.png" alt="handled." className="h-7 w-auto" />
        </a>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          Founding partner pilot · {PILOT_SPOTS_TOTAL} spots
        </p>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="px-6 pb-20 pt-10 md:pt-16">
      <div className="mx-auto max-w-3xl">
        <p
          className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: ACCENT }}
        >
          Founding partner pilot
        </p>
        <h1
          className="mb-6 text-balance text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}
        >
          Looking for {PILOT_SPOTS_TOTAL} home service contractors to test the future of their front office.{" "}
          <span style={{ color: ACCENT }}>Free for 90 days.</span>
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-gray-600 md:text-xl">
          AI that answers every call, books every job, asks for every review,
          and chases every referral. Built by a marketer who&apos;s run $50M+
          in home services lead gen.
        </p>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <a
            href="#apply"
            className="inline-block rounded-full bg-gray-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Apply for the pilot →
          </a>
          <p className="text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{PILOT_SPOTS_OPEN}</span> of{" "}
            {PILOT_SPOTS_TOTAL} spots open · pilot starts {PILOT_START}
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionDivider({ number, label }: { number: string; label: string }) {
  return (
    <div className="px-6">
      <div className="mx-auto max-w-5xl border-t border-gray-200 pt-12 md:pt-16">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          {number} &nbsp;&middot;&nbsp; {label}
        </p>
      </div>
    </div>
  );
}

function Check() {
  return (
    <span
      className="mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
      style={{ background: `${ACCENT}1a`, color: ACCENT }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </span>
  );
}

function Criteria() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          If you nod at all three, you&apos;re in.
        </h2>
        <ul className="space-y-5">
          {CRITERIA.map((c, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-gray-800 md:text-lg">
              <Check />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FiveThings() {
  return (
    <section className="px-6 pb-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 max-w-2xl text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          Five things that, together, replace a $50k office manager.
        </h2>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_320px] md:gap-16">
          <ol className="space-y-8">
            {FIVE_THINGS.map((t, i) => (
              <li key={t.name} className="grid grid-cols-[28px_1fr] gap-x-4">
                <span className="text-xs font-semibold tracking-wide text-gray-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                    <span className="text-lg font-bold text-gray-900">{t.name}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600">{t.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="md:pt-2">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        The &ldquo;ouch&rdquo; moment
      </p>
      <p className="mb-6 text-base font-semibold text-gray-900">
        You&apos;re on a roof. Your phone buzzes. Ava already booked the job.
      </p>

      <div className="relative mx-auto w-full max-w-[280px] rounded-[36px] border border-gray-200 bg-gray-50 p-3 shadow-sm">
        <div className="rounded-[28px] bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold text-gray-700">
            <span>9:41</span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            </span>
          </div>

          <Notification
            title="Ava — handled"
            body="Booked Mike Hernandez — Thursday 2pm. AC tune-up. Quote sent."
          />
          <Notification
            title="Ava — handled"
            body="New lead: Jenna Park, roof leak. Estimate scheduled. Friday 10am."
          />
          <Notification title="Ava — handled" body="Sent 5 review asks." />
        </div>
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.14em] text-gray-400">
        (A real dashboard, not just a fake screenshot)
      </p>
    </div>
  );
}

function Notification({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="mb-0.5 flex items-center gap-2">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-md text-[8px] font-bold text-white"
          style={{ background: ACCENT }}
        >
          h
        </span>
        <span className="text-[10px] font-semibold text-gray-700">{title}</span>
      </div>
      <p className="text-[11px] leading-snug text-gray-700">{body}</p>
    </div>
  );
}

function ThreeMonthsBanner() {
  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          Three months free.{" "}
          <span className="text-gray-400">No credit card.</span>
        </p>
      </div>
    </section>
  );
}

function Asks() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          Honesty, mostly. And a few hours of your time.
        </h2>
        <ul className="space-y-5">
          {ASKS.map((a, i) => (
            <li key={i} className="flex items-start gap-3 text-base text-gray-800 md:text-lg">
              <Check />
              <span dangerouslySetInnerHTML={{ __html: highlightWeeks(a) }} />
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">That&apos;s it.</span>{" "}
          No payment. No contract. No upsell. If it&apos;s not working at week 12, you walk.
        </p>
      </div>
    </section>
  );
}

function highlightWeeks(s: string): string {
  return s.replace(
    /(week 2, week 6, and week 10)/i,
    '<strong class="font-semibold text-gray-900">$1</strong>'
  );
}

function Bio() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          I&apos;m Kyle.
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[140px_1fr] md:gap-10">
          <img
            src="/kyle-headshot.png"
            alt="Kyle Adams"
            className="aspect-square w-full max-w-[140px] rounded-xl object-cover ring-1 ring-gray-200"
          />
          <div className="text-base leading-relaxed text-gray-700 md:text-[15px]">
            <p className="mb-4">
              I&apos;ve spent the last decade running marketing for home service
              businesses, including a marketplace that drove{" "}
              <strong className="font-semibold text-gray-900">over $50M in revenue</strong>{" "}
              and 350+ closed deals a month across solar, roofing, and HVAC. I
              currently run marketing for Rooftop Power Co.
            </p>
            <p>
              I&apos;m building <strong className="font-semibold text-gray-900">handled.</strong>{" "}
              because I watched too many one-truck shops get crushed by software
              that wasn&apos;t built for them.{" "}
              <strong className="font-semibold text-gray-900">
                This isn&apos;t a venture-backed startup looking for logos.
              </strong>{" "}
              It&apos;s me, building the tool I wished existed when I was scaling
              lead gen for trades.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Apply() {
  return (
    <section id="apply" className="px-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
          Apply for one of the {PILOT_SPOTS_TOTAL} pilot spots.
        </h2>
        <p className="mb-10 text-sm text-gray-600">
          Takes about three minutes. I read every one.
        </p>
        <PilotApplyForm />
      </div>
    </section>
  );
}

function PilotFooter() {
  return (
    <footer className="border-t border-gray-200 px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-[11px] uppercase tracking-[0.16em] text-gray-400 md:flex-row">
        <span className="font-semibold normal-case tracking-normal text-gray-700">handled.</span>
        <span>© handled. — built by Kyle</span>
        <a href="mailto:kyle@gethandled.ai" className="hover:text-gray-700">
          kyle@gethandled.ai
        </a>
      </div>
    </footer>
  );
}
