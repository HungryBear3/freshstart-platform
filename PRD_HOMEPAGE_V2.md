# PRD: Fresh Start IL — Homepage V2 Improvements

## Goal
Improve conversion and credibility on the homepage, inspired by Untangle.us patterns.
All changes are in `/Users/abigailclaw/freshstart-platform`.

## Tasks

### 1. Attorney Credibility Section
Add a new component `components/home/AttorneySection.tsx` and render it on the homepage (`app/page.tsx`) between TrustBadgesSection and HowItWorksSection.

Content:
- Section heading: "Guidance you can trust"
- Subheading: "FreshStart IL is built around Illinois law — every form, deadline, and calculator is tailored to Illinois courts and the Illinois Marriage and Dissolution of Marriage Act."
- Add a placeholder attorney quote card styled like Untangle's CLO quote:
  - Quote text: "Illinois divorce law is complex. FreshStart IL gets the forms right."
  - Attribution: "Illinois Family Law Attorney — Legal Advisor (partnership in progress)"
  - Style: white card, light gray border, blue left accent bar, italic quote, small gray attribution text
  - Add a small badge/chip that says "Attorney-Reviewed Guidance" with a shield icon

### 2. Intro Call Banner
Add a sticky or prominent banner component `components/home/IntroCallBanner.tsx`.
Render it just above the footer on the homepage.

Content:
- Background: soft blue (blue-50 or similar)
- Text: "Not sure where to start? We offer a free 15-minute orientation call to point you in the right direction."
- CTA button: "Book a Free Call" → links to `https://calendly.com/freshstart-il/intro` (external, target="_blank")
- Include a phone icon from lucide-react
- Should be responsive — stacked on mobile, side-by-side on desktop

### 3. Pricing Page — Attorney Cost Anchor
In `app/pricing/page.tsx`, add a callout box near the top of the page (above the feature list, below the headline):

Content:
- Background: amber-50 or yellow-50
- Icon: DollarSign or TrendingDown from lucide-react
- Bold line: "Illinois divorce attorneys average $15,000–$25,000 in total fees."
- Sub-line: "FreshStart IL costs a fraction of a single consultation. Handle your uncontested divorce with confidence — without the hourly rate."
- Style: rounded-lg, border border-amber-200, p-4 or p-6

### 4. How It Works — Add Step Numbers + Tighten Copy
Read `components/home/HowItWorksSection.tsx` and update it to:
- Add visible step numbers (1, 2, 3) styled as large blue circles before each step title
- Make sure steps are: (1) Answer a few questions, (2) Get your court-ready documents, (3) File with confidence
- If current steps don't match, update copy to match that flow
- Keep existing styling but enhance visual hierarchy

## Constraints
- Use existing Tailwind CSS + shadcn/ui component patterns already in the project
- Do not add new dependencies
- All lucide-react icons are already available
- Maintain existing TypeScript patterns
- Test that nothing breaks: `npm run build` at the end

## Completion
When all tasks are done and `npm run build` succeeds, commit with message:
`feat: homepage v2 — attorney section, intro call banner, pricing anchor, how-it-works polish`

Then run:
`openclaw system event --text "Done: Fresh Start homepage V2 improvements built and committed. Attorney section, intro call banner, pricing anchor, how-it-works polish." --mode now`
