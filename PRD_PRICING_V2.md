# PRD: Fresh Start IL — Pricing Page V2

## Goal
Polish the pricing page with better plan layout, feature comparison table, updated FAQs, and social proof near CTAs.

## Working Directory
`/Users/abigailclaw/freshstart-platform` (branch: main)

## Tasks

### 1. Plan Layout
- Display One-Time Access and Annual plans side by side (or stacked on mobile)
- Clear pricing display with plan names and terms

### 2. Feature Comparison Table
- Add a simple comparison table showing what each plan includes
- Differentiate clearly between One-Time and Annual

### 3. FAQ Update
Replace existing FAQs with these questions:
- "Do I need a lawyer to use FreshStart IL?"
  Answer: "FreshStart IL is perfect for people representing themselves (pro se) or those with an attorney who want to save money. Our platform guides you through every step, whether you're going it alone or working with a lawyer."
- "What if my spouse and I disagree on things?"
  Answer: "FreshStart IL includes tools and guidance to help you work through disagreements and find fair solutions. For complex disputes, we recommend consulting with a mediator or attorney."
- "Will my forms be accepted by the court?"
  Answer: "Yes. We automatically fill all required Illinois divorce form fields correctly, following current court rules and Illinois Compiled Statutes. Forms are formatted according to Illinois court requirements."
- "How long does the divorce process take?"
  Answer: "Illinois requires a 90-day waiting period after filing. Most uncontested divorces are finalized in 3-6 months. FreshStart IL helps you move as quickly as possible by keeping you organized and on track."
- "Can I use FreshStart IL if I have children or complex finances?"
  Answer: "Yes. FreshStart IL handles parenting plans, child support calculations, and asset division. For very complex situations, we recommend consulting an attorney alongside our platform."

### 4. Social Proof Near CTAs
- Keep/move existing testimonial section near the CTA buttons
- Testimonials act as social proof right before purchase decision

### 5. Preserve existing functionality
- All subscribe/checkout buttons must continue to work
- Don't break existing Stripe integration

## Constraints
- Use existing shadcn/ui components
- No new npm dependencies
- Run `npm run build` and fix any TypeScript errors before committing

## Completion
When done:
1. Commit: `feat: pricing page v2 - comparison table, updated FAQs, social proof`
2. Push: `git push origin main`
3. Run: `openclaw system event --text "Done: FS pricing page v2 complete" --mode now`
