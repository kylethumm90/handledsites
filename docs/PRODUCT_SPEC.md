# handled. — Full App Build Prompt

## Product Overview

handled. is a mobile-first AI front office for home service contractors (solar, roofing, HVAC, lawn care). The core philosophy: contractors never see a spreadsheet. All data lives underneath — AI reads it and surfaces what matters as cards, hints, and actions. The contractor sees conversations and recommendations, not rows and columns.

The app has TWO tabs:
1. **Pipeline** — the full customer lifecycle (pre-sale + post-sale in one unified view)
2. **Pulse** — the intelligence/analytics layer

There are TWO tiers:
1. **Base tier** — AI reads data and shows context hints, but the contractor takes all actions manually
2. **AI Team tier** — Ava (speed-to-lead agent) and Stella (reputation agent) act autonomously

---

## Brand & Design System

### Colors
- Primary text/headings: dark navy `#1E2A3A`
- CTA buttons and accents: amber orange `#E8922A`
- Backgrounds: warm off-white `#F7F7F5` (never pure white for page bg)
- Cards: white `#FFFFFF` with `#E8E8E4` borders
- Light borders: `#F0F0EC`
- Success/positive: `#16A34A`
- Error/recovery: `#DC2626`
- Contacted/info: `#2563EB`
- Referral/purple: `#7C3AED`

### Typography
- Body/UI: DM Sans (weights: 400, 500, 600, 700)
- Numbers/data/monospace: IBM Plex Mono (weights: 400, 500, 600, 700)
- Section labels: 9px, uppercase, letter-spacing 0.08em, DM Sans 600, muted gray
- Stage badges: IBM Plex Mono, 8-9px, 600 weight, uppercase, letter-spacing 0.04em

### Design Rules
- NO rounded corners — square/sharp edges everywhere
- NO gradients, NO shadows (except phone frame mockups)
- NO tables, NO spreadsheet layouts — ever
- AI context hints always appear in amber background `#FFF8EF` with left border `2px solid #E8922A`
- Recovery/negative always uses red background `#FEF2F2` with red left border
- Spacious padding — 14-16px on cards, 20-24px page margins
- Mobile-first — everything must work on a phone held in one hand
- The brand name is always lowercase with a period: `handled.`

### AI Visual Pattern
- Gold/amber banner with left border accent = the AI is telling you something
- Green dot = agent took an action (AI Team tier only)
- Red left border = needs human attention
- Dashed border with ⚡ icon = upsell hint (Base tier only)

---

## Screen 1: Dashboard (Home Screen)

The dashboard is a morning briefing — not a dashboard full of charts. Glance, absorb, move on.

### AI Team Tier — Three sections only:

**Section 1: "X things that need you"**
- Red section label with dot
- Cards with colored left borders (red for recovery, amber for Ava escalations)
- Each card: bold title (person + issue), one line of context, single CTA button
- Recovery alerts from Stella (unhappy customer, review held)
- Ava escalations (lead asked a question Ava can't answer)
- Some days this section is empty — that's the point

**Section 2: "Since you last checked"**
- Ava summary paragraph: "Responded to X leads, booked X appointments, recovered X missed calls. Average response time: Xs."
- Stella summary paragraph: "Collected X feedback responses. [Name] posted a X-star review. [Name] referred a neighbor. Flagged X recovery alerts."
- Each agent gets a circular avatar (A = amber, S = green) with their name
- Separated by a thin divider
- This is two paragraphs, NOT a feed or list

**Section 3: "Today's schedule"**
- Appointment cards: time (monospace, bold), name, job type, assigned rep, confirmed/unconfirmed badge
- Green badge = CONFIRMED, amber badge = UNCONFIRMED

**Footer:** "That's everything. Your AI team has the rest handled."

### Base Tier — Same structure, different energy:

**Section 1: "X leads waiting for a response"**
- Same card layout but shows wait times in red: "Waiting 14 hours for a response"
- Manual CALL / TEXT buttons instead of contextual CTAs
- Everything surfaces because nobody is handling it

**Section 2: "This week" stats**
- Four stat boxes: New Leads, Missed Calls, Reviews, Site Views
- Raw numbers with no interpretation
- No agent summaries since agents aren't running

**Section 3: "Today's schedule"**
- Same layout but more appointments show UNCONFIRMED since nobody auto-confirms

**Section 4: "Recent activity"**
- Chronological event log with timestamps and colored dots
- Missed calls, form submissions, reviews — just events, no AI actions

**Upsell hints** (dashed border, ⚡ icon) appear after each section:
- "With Ava, these leads would have been texted back in under 10 seconds"
- "With Pulse, these numbers come with insights"
- "Ava confirms appointments automatically"
- "Stella would have already sent review requests"

**Bottom CTA:** Dark navy block with pain statement + "ACTIVATE YOUR AI TEAM" amber button

---

## Screen 2: Pipeline (Unified Lifecycle)

One screen with a toggle: **Pipeline | Post-Sale**. Same contacts, same design, same data. The toggle swaps which four stages are visible. Never more than four stages at once.

### Toggle
- Full-width two-button toggle at top
- Active button: navy background, white text
- Inactive button: transparent, gray text
- AI Team tier shows "Pipeline by Ava" / "Post-Sale by Stella"
- Base tier shows just "Pipeline" / "Post-Sale"

### Stage Boxes (always four)

**Pipeline view:**
- New (amber) → Contacted (blue) → Appt Set (navy) → Job Done (green)

**Post-Sale view:**
- Recovery (red) → Feedback (amber) → Reviewed (green) → Referrer (purple)

Each box: monospace count number (large, colored), label below (tiny uppercase). Tapping a box filters the cards below. Tapping again clears the filter.

### Agent Status Bar (AI Team tier only)
- Colored left border + background matching the agent
- Small circular avatar (A or S)
- One-line summary: "Responded to 7 leads today · Avg response: 8 seconds · 2 appointments booked"

### Contact Cards

Each contact is a card with:
1. **Avatar** — Circle with initials, colored border for recovery contacts
2. **Name + Stage badge** — Name in 15px bold, stage badge top-right (monospace, tiny, colored background)
3. **AI context hint** — Gold/amber banner with left border. One sentence of context. Present on BOTH tiers. Examples:
   - "Wants a roofing estimate. Came through quiz funnel — has storm damage."
   - "3 weeks since completion. Feedback window closing — send soon."
   - "Mentioned his neighbor Dave wants a quote. This is a warm referral — act fast."
4. **Agent action line** (AI Team tier only) — Green dot + "Ava texted back in 8 seconds" or "Stella sent review request"
5. **Wait time** (Base tier, pipeline only) — Red banner: "Waiting 14 hours for a response"
6. **CTA buttons** — Single contextual CTA on AI Team tier ("CALL DAVE"), dual CALL/TEXT on Base tier

### Recovery Cards (Post-Sale view)
- Red left border, red avatar border
- Sentiment score displayed (monospace, red, bold)
- Customer feedback quote in the hint area
- Red CTA: "CALL [NAME]"
- AI Team tier: "Stella holding review request until you call"

### Post-Sale specific elements
- Review badge when present: "★ 5★ Google" in green monospace
- Referral info: purple text with referral name
- Base tier: "SEND FEEDBACK REQUEST" / "FOLLOW UP ON REFERRAL" manual CTAs

---

## Screen 3: Pulse (Intelligence Layer)

Pulse shows the numbers, funnels, and cross-product insights. This is the ONLY screen with data visualization. Everything here is read-only — no actions, no CTAs (except insight action links).

### Header
- "handled. pulse" in the navy header bar
- Period selector pills: 7d / 30d / 90d (monospace, in header)
- Green live indicator dot

### Greeting
- "Morning/Afternoon/Evening, [Name]."
- Today's date below

### Health Score + Key Metrics
- Health score arc (SVG gauge, 0-100, green/amber/red based on score)
- Four metrics alongside: Pipeline Value, Revenue (30d), Avg Response, Lead → Booked
- Each metric: tiny uppercase label, large monospace number, change badge (+/-%)

### Reputation Metrics Row
- Four small stat boxes: Sentiment, Review Rate, Avg Rating, Referral Revenue
- Change badges on each

### Funnels — The Full Lifecycle

**Ava Funnel (amber bars):**
Leads → Contacted → Appt Set → Job Done
- Label: "AVA — PIPELINE"
- Each step: large monospace number, tiny uppercase label, amber progress bar, percentage

**Handoff line:**
"↓ X JOBS COMPLETED — STELLA TAKES OVER ↓" (centered, monospace, muted)

**Stella Customer Track (green bars, purple on last):**
Jobs → Feedback → Reviewed → Referrer
- Label: "STELLA — CUSTOMER TRACK"

**Divider line**

**Stella Referrer Track (purple bars):**
Active → Check-ins → Referrals In → Revenue
- Label: "STELLA — REFERRER TRACK"
- Revenue step uses smaller font for dollar amount

### Agent Status Cards
- Two-column grid: Ava (left) and Stella (right)
- Each: label, green status dot, 3 key-value rows
- Ava: Conversations today, Bookings today, After-hours saves
- Stella: Feedback collected, Reviews posted, Recovery flags

### Insights (the unique value of Pulse)
- Section label: "INSIGHTS"
- Accordion cards with priority-colored left borders (red = high, amber = medium, gray = low)
- Collapsed: icon + one-line title + metric value + chevron
- Expanded: tags (agent badges), body paragraph, metric callout box, action link
- These are CROSS-PRODUCT observations:
  - "Referral leads close at 78% — 2x your website rate"
  - "Review rate dropped — Friday jobs aren't converting"
  - "Tuesday leads convert at 68% — run promos Monday night"
  - "After-hours = 31% of pipeline — $9.1k from Ava saves"
  - "3 past customers are due for a check-in"

---

## Data Architecture

### One contacts table
- `status` field determines where the contact appears
- Pipeline shows: new, contacted, follow_up, appt_set, job_done
- Post-Sale shows: feedback, review_asked, reviewed, referral_asked, referrer, recovery
- NO separate tables for leads vs customers

### Key supporting tables
- `activities` — the timeline (What Happened)
- `reviews` — linked to contact
- `referrals` — links referrer contact to referred contact
- `sentiment_scores` — tracks sentiment over time
- `ai_context_cache` — pre-computed AI summaries refreshed on each meaningful activity

### AI Context Generation
- The gold hint banners are generated from the ai_context_cache
- Updated whenever a meaningful activity occurs
- One sentence, actionable, specific to the contact's current stage
- Never generic — always references specific data points

---

## Tech Stack
- Next.js on Vercel
- Supabase (Postgres) for database
- DM Sans + IBM Plex Mono from Google Fonts
- Mobile-first responsive design
- No heavy chart libraries — inline SVG for sparklines and gauges

---

## What NOT to Build
- No sidebar navigation — bottom tab bar only (Pipeline, Pulse)
- No settings/config screens yet
- No onboarding flows yet
- No chat interfaces or chatbot UIs — agents work in the background
- No tables, spreadsheets, or data grids — EVER
- No rounded corners
- No gradients or decorative shadows
