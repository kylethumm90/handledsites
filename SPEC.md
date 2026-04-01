# handled.sites — Product Specification

## Overview

A Next.js web app where independent home service contractors can create a free mobile business card website. Contractors fill out a form on the landing page, and a shareable URL is generated with their professional card.

**Live URL format:** `yourdomain.com/[slug]`

---

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Fonts:** Instrument Serif (headlines), DM Sans (body) on landing page; Inter on card page

---

## Pages

### Page 1: Landing Page (`/`)

#### Layout

Two-column hero section:
- **Left column:** Marketing copy
- **Right column:** Signup form with a live phone mockup preview

#### Signup Form Fields

| Field | Type | Details |
|-------|------|---------|
| Business name | Text input | Required |
| Owner name | Text input | Required |
| Phone number | Text input | US-only, validated as 10 digits, displayed as `(XXX) XXX-XXXX`, stored as digits only |
| City | Text input | Required, free text |
| State | Dropdown | All 50 US states + DC |
| Trade | Dropdown | HVAC, Roofing, Plumbing, Electrical, Landscaping, Painting, General Contractor, Other |
| Services offered | Checkbox grid | Repairs, Installations, Maintenance, Inspections, Emergency, Free estimates |
| Licensed & Insured | Checkbox | Optional. Only shows "Licensed & Insured" badge on card when checked |

#### Spam Protection

Include a **honeypot field** — a hidden form field invisible to humans but filled by bots. If the honeypot field has a value on submit, silently reject the submission.

#### Live Phone Preview

A **simplified preview** in a phone frame on the right side of the form. Updates in real-time as the user types. Shows:
- Business name
- City, State
- Trade icon
- Phone number
- Dark card mockup styling

This is NOT a full-fidelity replica of the card page — it's a simplified representation that conveys the idea.

#### On Submit

1. Validate all required fields
2. Check honeypot field (reject if filled)
3. Generate slug from business name (see Slug Generation below)
4. Insert row into `contractor_sites` table via Supabase
5. Show **success state** inline (no redirect)

#### Success State

Replace the form with:
- The shareable URL (e.g., `yourdomain.com/blue-hen-hvac`)
- A **"Copy link"** button
- A **QR code** generated client-side using `qrcode.react`
- The QR code encodes the full shareable URL

#### Below the Hero

1. **Three feature cards** explaining why it works:
   - Converts visitors to calls
   - Found by AI search engines
   - Shareable anywhere (text, email, truck decal)

2. **Second section:** Phone card mockup (static) with a checklist of what's included in the free card.

#### Design System — Landing Page

- Clean light mode
- **Headlines:** Instrument Serif
- **Body text:** DM Sans
- Minimal borders, generous whitespace

---

### Page 2: Contractor Card (`/[slug]`)

The public-facing mobile business card. Dark background, centered layout.

#### Layout & Styling

- Background: `#12151f`
- Surface: `#1a1e2e`
- Max-width: `420px`, centered
- Full mobile-first experience
- Font: Inter

#### Card Layout (top to bottom)

1. **Banner strip** — Seasonal/promotional message pulled from `banner_message` DB field. Default: `"Now booking spring projects — call today!"`

2. **Avatar circle** — Displays contractor's initials (first letter of first two words of business name)

3. **Business info block**
   - Business name
   - City, State
   - "Licensed & Insured" badge (only if `licensed_insured` is `true`)

4. **Availability indicator**
   - Green pulsing dot with **"Available now"** during business hours
   - Gray dot with **"After hours — leave a message"** outside business hours
   - Business hours default: 7am–7pm Eastern time
   - Hours stored in DB fields (`hours_start`, `hours_end`) with defaults, ready for future dashboard
   - All times evaluated against **Eastern timezone** (hardcoded for MVP)

5. **Three CTA buttons**

   | Button | Color | Action |
   |--------|-------|--------|
   | Call | `#e03535` (red) | Opens `tel:+1XXXXXXXXXX` |
   | Text us instead | `#1a4d2e` bg / `#4ade80` text (dark green) | Opens `sms:+1XXXXXXXXXX?body=Hi, I need a quote` |
   | Save to contacts | `#1a2a4a` bg / `#5b8ef0` text (dark blue) | Web Share API first, fallback to `.vcf` download |

6. **Save to contacts behavior**
   - Try `navigator.share()` first (mobile-friendly)
   - Fallback: generate and download a `.vcf` file
   - vCard includes: business name, phone number, city/state, contractor's handled.sites URL as website

7. **2x2 Services grid** — Displays selected services with **icons per trade/service** (use Lucide icons). Map each trade to a specific icon:
   - HVAC → Wind/Thermometer
   - Roofing → Home
   - Plumbing → Wrench
   - Electrical → Zap
   - Landscaping → Trees
   - Painting → Paintbrush
   - General Contractor → Hammer
   - Other → Tool

8. **Location pill** — City, State in a rounded pill

9. **Google Reviews section**
   - Show review count and star rating
   - Only displayed when `review_count` and `avg_rating` have values (nullable fields)
   - Hidden when data is null (no placeholder shown)

10. **Footer** — "powered by handled.sites"

#### Design System — Card Page

| Element | Value |
|---------|-------|
| Background | `#12151f` |
| Surface | `#1a1e2e` |
| Call button | `#e03535` |
| Text button bg | `#1a4d2e` |
| Text button text | `#4ade80` |
| Save button bg | `#1a2a4a` |
| Save button text | `#5b8ef0` |
| Muted text | `#9aa0b8` |

#### SEO & Metadata

**JSON-LD Schema** (in `<head>`):
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[business_name]",
  "telephone": "[phone]",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "[city]",
    "addressRegion": "[state]"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "itemListElement": ["[services array]"]
  }
}
```

**Open Graph meta tags:**
- `og:title` — Business name
- `og:description` — "{trade} services in {city}, {state}"
- `og:image` — Dynamic OG image generated via `@vercel/og` (Vercel OG Image Generation). Shows business name and trade on a branded background.

#### Data Fetching

- **ISR (Incremental Static Regeneration)** with `revalidate: 60` (60 seconds)
- Data fetched server-side using Supabase **service role key** (not the anon key)
- Server components fetch contractor data by slug

---

## Supabase

### Table: `contractor_sites`

| Column | Type | Details |
|--------|------|---------|
| `id` | `uuid` | Primary key, auto-generated |
| `business_name` | `text` | Required |
| `owner_name` | `text` | Required |
| `phone` | `text` | 10 digits, stored as digits only |
| `city` | `text` | Required |
| `state` | `text` | 2-letter state code |
| `trade` | `text` | One of the trade options |
| `services` | `text[]` | Array of selected services |
| `slug` | `text` | Unique, auto-generated from business name |
| `licensed_insured` | `boolean` | Default `false` |
| `banner_message` | `text` | Default: `"Now booking spring projects — call today!"` |
| `hours_start` | `integer` | Default `7` (7am ET) |
| `hours_end` | `integer` | Default `19` (7pm ET) |
| `review_count` | `integer` | Nullable. For future GBP integration |
| `avg_rating` | `numeric(2,1)` | Nullable. For future GBP integration |
| `created_at` | `timestamptz` | Default `now()` |

**Unique constraint** on `slug`.

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

- **Anon key** (`NEXT_PUBLIC_`): Used client-side for inserts only
- **Service role key** (server-only, NOT prefixed with `NEXT_PUBLIC_`): Used in server components to read data, bypassing RLS

### Row-Level Security (RLS)

| Operation | Policy |
|-----------|--------|
| `INSERT` | Public (anon key can insert) |
| `SELECT` | Blocked for anon key. All reads go through server-side service role key |
| `UPDATE` | Blocked (future: authenticated contractors only) |
| `DELETE` | Blocked |

---

## Slug Generation

1. Take the business name
2. Convert to lowercase
3. Replace spaces with hyphens
4. Strip all characters except `a-z`, `0-9`, and `-`
5. Collapse multiple consecutive hyphens into one
6. Trim leading/trailing hyphens
7. **Blocklist check:** Reject reserved paths — `api`, `admin`, `_next`, `favicon`, `sitemap`, `robots`, `login`, `signup`, `dashboard`
8. **Profanity filter:** Block common profane words (basic list)
9. **Collision check:** Query Supabase for existing slug. If exists, append `-2`, then `-3`, etc.

---

## Dynamic OG Image (`/api/og`)

API route using `@vercel/og` (ImageResponse) to generate Open Graph images for card pages.

- Input: `business_name`, `trade`, `city`, `state` (via query params)
- Output: 1200x630 PNG
- Design: Dark background matching card theme, business name large, trade and location below, handled.sites branding

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `next` 14.x | Framework |
| `react`, `react-dom` | UI |
| `tailwindcss` | Styling |
| `@supabase/supabase-js` | Supabase client |
| `qrcode.react` | QR code generation (client-side, success screen) |
| `lucide-react` | Icons for trades and services |
| `@vercel/og` | Dynamic OG image generation |

---

## File Structure

```
app/
├── layout.tsx              # Root layout, font imports
├── page.tsx                # Landing page
├── [slug]/
│   └── page.tsx            # Contractor card page (server component)
├── api/
│   └── og/
│       └── route.tsx       # OG image generation endpoint
components/
├── SignupForm.tsx           # Form with validation + honeypot
├── PhonePreview.tsx         # Simplified live preview in phone frame
├── SuccessState.tsx         # URL + copy + QR code
├── FeatureCards.tsx         # Three feature cards section
├── IncludedChecklist.tsx    # What's included section
├── ContractorCard.tsx       # Full card page layout
├── AvailabilityDot.tsx      # Pulsing dot with business hours logic
├── CTAButtons.tsx           # Call, Text, Save buttons
├── ServicesGrid.tsx         # 2x2 services with icons
├── ReviewStars.tsx          # Google reviews display
├── BannerStrip.tsx          # Seasonal banner
lib/
├── supabase.ts             # Supabase client setup (anon + service role)
├── slug.ts                 # Slug generation, sanitization, blocklist
├── vcard.ts                # vCard generation
├── icons.ts                # Trade-to-icon mapping
├── constants.ts            # Trades, services, states lists
```

---

## Summary of Key Decisions

| Decision | Choice |
|----------|--------|
| Data access for card page | Server-side only (service role key) |
| Save to contacts | Web Share API first, .vcf fallback |
| Banner editing | Per-contractor DB field |
| Availability dot | Business hours (DB field with 7am-7pm ET default) |
| Timezone | Eastern timezone for all (MVP) |
| Slug safety | Sanitize + reserved path blocklist + basic profanity filter |
| SMS pre-fill | `"Hi, I need a quote"` |
| Phone preview | Simplified dark card mockup |
| Phone validation | US-only, 10 digits |
| Success screen | URL + copy button + QR code |
| Google reviews | DB fields now (nullable), show section only when data exists |
| Data fetching | ISR with 60s revalidation |
| Licensed & Insured | Checkbox at signup, shown on card only if checked |
| Spam protection | Honeypot field |
| OG tags | Dynamic og:title, og:description, og:image via @vercel/og |
| State input | Dropdown (50 states + DC) |
| Trade icons | Lucide icon mapped per trade |
| QR code | Client-side via qrcode.react |
| Business hours default | 7am–7pm ET, stored in DB for future configurability |
