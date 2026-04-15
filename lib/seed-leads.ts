/**
 * Demo seed leads — fictional TV/movie characters with home-service CRM notes.
 * All rows carry is_demo: true so they can be bulk-deleted later.
 */

type SeedLead = {
  name: string;
  phone: string;
  email: string;
  source: string;
  status: "lead" | "contacted" | "booked" | "customer";
  service_needed: string | null;
  notes: string | null;
  tags: string[];
  is_demo: boolean;
  /** Minutes ago the lead was "created" — converted to a real timestamp at insert time */
  _minutes_ago: number;
};

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

const SEED: SeedLead[] = [
  // ── New leads (status: "lead") ──────────────────────────────
  {
    name: "Hank Hill",
    phone: "5550101001",
    email: "hank.hill@strickland.fake",
    source: "manual",
    status: "lead",
    service_needed: "Furnace installation",
    notes: "Wants propane furnace quote, very particular about BTU ratings. Said he sells propane so he'll know if we cut corners.",
    tags: [],
    is_demo: true,
    _minutes_ago: 35,
  },
  {
    name: "Tim Taylor",
    phone: "5550101002",
    email: "tim.taylor@tooltime.fake",
    source: "quiz_funnel",
    status: "lead",
    service_needed: "Roof repair",
    notes: "Roof damaged after \"upgrading\" his satellite dish. Wife says it's the third time. Wants it fixed before she finds out about the new hole.",
    tags: [],
    is_demo: true,
    _minutes_ago: 90,
  },
  {
    name: "Peter Griffin",
    phone: "5550101003",
    email: "peter.griffin@pawtucket.fake",
    source: "quiz_funnel",
    status: "lead",
    service_needed: "Solar installation",
    notes: "Saw Facebook ad, wants to know if solar can power \"a really big TV.\" Very enthusiastic, low technical understanding.",
    tags: [],
    is_demo: true,
    _minutes_ago: 120,
  },

  // ── Contacted (status: "lead", older timestamps) ────────────
  {
    name: "Mike Brady",
    phone: "5550101004",
    email: "mike.brady@bradybunch.fake",
    source: "contact_form",
    status: "lead",
    service_needed: "HVAC system design",
    notes: "Architect with opinions. Split-level house, six kids. Wants zoned heating so the boys' side and girls' side have separate thermostats.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 26, // ~1 day ago
  },
  {
    name: "Al Bundy",
    phone: "5550101005",
    email: "al.bundy@garysshoes.fake",
    source: "quiz_funnel",
    status: "lead",
    service_needed: "AC repair",
    notes: "AC went out, budget tight. Works at a shoe store. Asked three times about financing options. Wife Peggy called separately to confirm appointment.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 50, // ~2 days ago
  },
  {
    name: "Bob Belcher",
    phone: "5550101006",
    email: "bob.belcher@bobsburgers.fake",
    source: "contact_form",
    status: "lead",
    service_needed: "HVAC service",
    notes: "Restaurant below, apartment above — commercial + residential HVAC. Grease buildup in ductwork. Mentioned a landlord named Mr. Fischoeder.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 36, // ~1.5 days ago
  },

  // ── Appointment set (status: "booked") ──────────────────────
  {
    name: "Homer Simpson",
    phone: "5550101007",
    email: "homer.simpson@snpp.fake",
    source: "quiz_funnel",
    status: "booked",
    service_needed: "Solar installation",
    notes: "Works at nuclear plant but wants solar at home. Wife Marge is the decision maker — make sure she's present for the appointment. Mentioned donuts twice.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 72, // ~3 days ago
  },
  {
    name: "Gomez Addams",
    phone: "5550101008",
    email: "gomez.addams@addamsfamily.fake",
    source: "manual",
    status: "booked",
    service_needed: "Roof replacement",
    notes: "Victorian mansion, money is no object. Wife Morticia wants black shingles specifically. Asked if we can work at night. Very polite, firm handshake.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 48, // ~2 days ago
  },
  {
    name: "Phil Dunphy",
    phone: "5550101009",
    email: "phil.dunphy@dunphyrealty.fake",
    source: "quiz_funnel",
    status: "booked",
    service_needed: "Solar installation",
    notes: "Real estate agent, already measured his roof on Google Maps. Very excited. Says he wants to be \"the cool dad with solar.\" Sent us a spreadsheet he made.",
    tags: ["referral"],
    is_demo: true,
    _minutes_ago: 60 * 96, // ~4 days ago
  },

  // ── Quoted (status: "lead" with notes about quote) ──────────
  {
    name: "Tony Soprano",
    phone: "5550101010",
    email: "tony.soprano@badabing.fake",
    source: "manual",
    status: "lead",
    service_needed: "HVAC installation",
    notes: "Wants top-of-the-line Carrier system. Pool house needs a separate unit. DO NOT mention the ducks. Very specific about who enters the property — call ahead.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 120, // ~5 days ago
  },
  {
    name: "Walter White",
    phone: "5550101011",
    email: "walter.white@jpwynne.fake",
    source: "contact_form",
    status: "lead",
    service_needed: "Solar installation",
    notes: "Chemistry teacher, very analytical. Ran his own energy calculations. Says he \"recently came into some money.\" Wants highest-efficiency panels available.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 144, // ~6 days ago
  },
  {
    name: "Roseanne Conner",
    phone: "5550101012",
    email: "roseanne.conner@lanford.fake",
    source: "quiz_funnel",
    status: "lead",
    service_needed: "Roof repair",
    notes: "Roof repair, NOT replacement — was very clear about that. Husband Dan does drywall so he'll handle interior damage. Wants the cheapest option that actually works.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 168, // ~7 days ago
  },

  // ── Closed / won (status: "customer") ───────────────────────
  {
    name: "Fred Flintstone",
    phone: "5550101013",
    email: "fred.flintstone@bedrock.fake",
    source: "quiz_funnel",
    status: "customer",
    service_needed: "Solar installation",
    notes: "24-panel solar system installed. Very happy with the work. Neighbor Barney Rubble now interested — asked us to call him.",
    tags: ["referral"],
    is_demo: true,
    _minutes_ago: 60 * 240, // ~10 days ago
  },
  {
    name: "Peggy Hill",
    phone: "5550101014",
    email: "peggy.hill@arlen.fake",
    source: "contact_form",
    status: "customer",
    service_needed: "Roof replacement",
    notes: "Full tear-off after tornado. Negotiated hard — ended up at 8% below list. Substitute teacher, speaks some Spanish. Left a 5-star review.",
    tags: ["review"],
    is_demo: true,
    _minutes_ago: 60 * 336, // ~14 days ago
  },

  // ── Lost ────────────────────────────────────────────────────
  {
    name: "Frank Reynolds",
    phone: "5550101015",
    email: "frank.reynolds@paddys.fake",
    source: "quiz_funnel",
    status: "lead",
    service_needed: "HVAC installation",
    notes: "LOST — wanted to use \"the sewers\" as natural cooling. We declined. Went with a cheaper competitor. Do not re-engage.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 480, // ~20 days ago
  },
  {
    name: "George Costanza",
    phone: "5550101016",
    email: "george.costanza@vandelay.fake",
    source: "contact_form",
    status: "lead",
    service_needed: "AC repair",
    notes: "LOST — called back and forth six times. Eventually said his mother wouldn't allow any changes to the house. Wished us well. Do not call back.",
    tags: [],
    is_demo: true,
    _minutes_ago: 60 * 360, // ~15 days ago
  },
];

export type SeedLeadRow = Omit<SeedLead, "_minutes_ago"> & {
  business_id: string;
  created_at: string;
};

/**
 * Returns 16 demo leads ready to insert, with timestamps relative to now.
 */
export function generateSeedLeads(businessId: string): SeedLeadRow[] {
  return SEED.map(({ _minutes_ago, ...rest }) => ({
    ...rest,
    business_id: businessId,
    created_at: minutesAgo(_minutes_ago),
  }));
}
