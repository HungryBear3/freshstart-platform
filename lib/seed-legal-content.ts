/**
 * Seed script for legal content
 * Run with: npx tsx lib/seed-legal-content.ts
 * Or use the API endpoint to add content
 */

import { prisma } from "@/lib/db/prisma"

const legalContent = [
  {
    title: "Grounds for Divorce in Illinois",
    slug: "grounds-for-divorce",
    category: "requirements",
    tags: ["divorce", "grounds", "irreconcilable differences"],
    published: true,
    content: `
      <h2>Grounds for Divorce in Illinois</h2>
      
      <p>Illinois is a "no-fault" divorce state, which means you don't need to prove that your spouse did something wrong to get a divorce.</p>
      
      <h3>Irreconcilable Differences</h3>
      <p>The most common ground for divorce in Illinois is <strong>irreconcilable differences</strong>. This means:</p>
      <ul>
        <li>The marriage has broken down</li>
        <li>There is no reasonable prospect of reconciliation</li>
        <li>The spouses have lived separate and apart for at least 6 months (or less if both agree)</li>
      </ul>
      
      <h3>What "Separate and Apart" Means</h3>
      <p>You don't necessarily need to live in different houses. Living "separate and apart" can mean:</p>
      <ul>
        <li>Living in separate residences, OR</li>
        <li>Living in the same house but in separate rooms, not sharing meals, and not acting as a married couple</li>
      </ul>
      
      <h3>No-Fault Divorce</h3>
      <p>Illinois eliminated fault-based grounds (like adultery, abandonment) in favor of the no-fault system. This makes the divorce process simpler and less adversarial.</p>
      
      <h3>Important Notes</h3>
      <ul>
        <li>You can file for divorce even if your spouse doesn't want one</li>
        <li>You don't need your spouse's agreement on the grounds</li>
        <li>The 6-month separation period can be waived if both spouses agree</li>
      </ul>
    `,
  },
  {
    title: "Property Division in Illinois Divorce",
    slug: "property-division",
    category: "process",
    tags: ["property", "division", "marital property", "assets"],
    published: true,
    content: `
      <h2>Property Division in Illinois Divorce</h2>
      
      <p>Illinois uses the principle of <strong>equitable distribution</strong> to divide property in divorce. This doesn't always mean 50/50, but rather what the court considers fair based on various factors.</p>
      
      <h3>Marital Property vs. Non-Marital Property</h3>
      
      <h4>Marital Property (Subject to Division)</h4>
      <ul>
        <li>Property acquired during the marriage</li>
        <li>Income earned during the marriage</li>
        <li>Property purchased with marital funds</li>
        <li>Retirement accounts accumulated during marriage</li>
        <li>Debts incurred during marriage</li>
      </ul>
      
      <h4>Non-Marital Property (Usually Not Divided)</h4>
      <ul>
        <li>Property owned before marriage</li>
        <li>Inherited property (unless commingled with marital property)</li>
        <li>Gifts received individually</li>
        <li>Property excluded by prenuptial agreement</li>
      </ul>
      
      <h3>Factors Considered in Property Division</h3>
      <p>The court considers many factors when dividing property, including:</p>
      <ul>
        <li>Each spouse's contribution to acquiring the property</li>
        <li>Each spouse's economic circumstances</li>
        <li>The duration of the marriage</li>
        <li>Any prenuptial or postnuptial agreements</li>
        <li>The age and health of each spouse</li>
        <li>Each spouse's earning capacity</li>
        <li>Tax consequences of the division</li>
      </ul>
      
      <h3>Common Property Types</h3>
      <ul>
        <li><strong>Real Estate:</strong> Family home, rental properties, land</li>
        <li><strong>Vehicles:</strong> Cars, trucks, boats, motorcycles</li>
        <li><strong>Bank Accounts:</strong> Checking, savings, money market accounts</li>
        <li><strong>Retirement Accounts:</strong> 401(k), IRA, pensions (may require QDRO)</li>
        <li><strong>Investments:</strong> Stocks, bonds, mutual funds</li>
        <li><strong>Business Interests:</strong> Ownership in businesses</li>
        <li><strong>Personal Property:</strong> Furniture, jewelry, collectibles</li>
      </ul>
      
      <h3>Important Considerations</h3>
      <ul>
        <li>Property division is separate from spousal maintenance (alimony)</li>
        <li>Debts are also divided, not just assets</li>
        <li>Valuation of complex assets (businesses, investments) may require experts</li>
        <li>Retirement accounts may require a Qualified Domestic Relations Order (QDRO)</li>
      </ul>
    `,
  },
  {
    title: "Child Custody and Parenting Time in Illinois",
    slug: "child-custody",
    category: "process",
    tags: ["custody", "parenting time", "children", "visitation"],
    published: true,
    content: `
      <h2>Child Custody and Parenting Time in Illinois</h2>
      
      <p>Illinois law uses the terms "allocation of parental responsibilities" and "parenting time" instead of the traditional "custody" and "visitation."</p>
      
      <h3>Allocation of Parental Responsibilities</h3>
      <p>This refers to decision-making authority for major decisions about the child:</p>
      <ul>
        <li><strong>Education:</strong> School choice, educational programs</li>
        <li><strong>Healthcare:</strong> Medical decisions, treatment choices</li>
        <li><strong>Religion:</strong> Religious upbringing and education</li>
        <li><strong>Extracurricular Activities:</strong> Sports, clubs, activities</li>
      </ul>
      
      <p>Responsibilities can be allocated:</p>
      <ul>
        <li><strong>Solely:</strong> One parent makes all decisions</li>
        <li><strong>Jointly:</strong> Both parents must agree on decisions</li>
        <li><strong>Split:</strong> Each parent has authority over different areas</li>
      </ul>
      
      <h3>Parenting Time (Formerly Visitation)</h3>
      <p>This is the schedule for when each parent spends time with the children. Common arrangements include:</p>
      <ul>
        <li><strong>50/50:</strong> Equal time with both parents</li>
        <li><strong>Primary with Visitation:</strong> One parent has majority time, other has regular visits</li>
        <li><strong>Every Other Weekend:</strong> Non-custodial parent has children every other weekend</li>
        <li><strong>Extended Summer:</strong> Longer periods during summer break</li>
      </ul>
      
      <h3>Factors Considered by the Court</h3>
      <p>Illinois courts consider the "best interests of the child" standard, including:</p>
      <ul>
        <li>The wishes of the child (if old enough to express them)</li>
        <li>The wishes of the parents</li>
        <li>The child's adjustment to home, school, and community</li>
        <li>The mental and physical health of all parties</li>
        <li>Each parent's ability to provide for the child's needs</li>
        <li>Any history of domestic violence or abuse</li>
        <li>The child's relationship with each parent</li>
        <li>Each parent's willingness to facilitate the child's relationship with the other parent</li>
      </ul>
      
      <h3>Parenting Plans</h3>
      <p>A parenting plan should address:</p>
      <ul>
        <li>Regular weekly schedule</li>
        <li>Holiday and special occasion schedules</li>
        <li>Summer vacation arrangements</li>
        <li>School break schedules</li>
        <li>Transportation arrangements</li>
        <li>Communication methods between parents</li>
        <li>Right of first refusal (if applicable)</li>
        <li>Dispute resolution procedures</li>
      </ul>
      
      <h3>Modification</h3>
      <p>Custody and parenting time orders can be modified if there's a substantial change in circumstances affecting the child's best interests.</p>
    `,
  },
  {
    title: "Spousal Maintenance (Alimony) in Illinois",
    slug: "spousal-maintenance",
    category: "process",
    tags: ["spousal maintenance", "alimony", "support", "financial"],
    published: true,
    content: `
      <h2>Spousal Maintenance (Alimony) in Illinois</h2>
      
      <p>Spousal maintenance (formerly called alimony) is financial support paid by one spouse to the other after divorce. Illinois has both statutory guidelines and discretionary factors.</p>
      
      <h3>Statutory Maintenance Guidelines</h3>
      <p>For marriages of certain lengths, Illinois provides statutory formulas:</p>
      
      <h4>Amount Calculation</h4>
      <p>Maintenance = 30% of payor's net income - 20% of payee's net income</p>
      <p>However, the total of maintenance and payee's net income cannot exceed 40% of the combined net income.</p>
      
      <h4>Duration Guidelines</h4>
      <ul>
        <li><strong>0-5 years:</strong> 20% of marriage length</li>
        <li><strong>5-10 years:</strong> 40% of marriage length</li>
        <li><strong>10-15 years:</strong> 60% of marriage length</li>
        <li><strong>15-20 years:</strong> 80% of marriage length</li>
        <li><strong>20+ years:</strong> Equal to marriage length or indefinite</li>
      </ul>
      
      <h3>When Guidelines Apply</h3>
      <p>The statutory guidelines apply when:</p>
      <ul>
        <li>Combined gross income is less than $500,000</li>
        <li>Payor has no obligation to pay child support or maintenance from a prior relationship</li>
        <li>Maintenance is not barred by agreement</li>
      </ul>
      
      <h3>Discretionary Factors</h3>
      <p>For longer marriages or when guidelines don't apply, courts consider:</p>
      <ul>
        <li>Income and property of each party</li>
        <li>Needs of each party</li>
        <li>Present and future earning capacity</li>
        <li>Time needed to acquire education/training</li>
        <li>Standard of living during marriage</li>
        <li>Duration of marriage</li>
        <li>Age and physical/emotional condition</li>
        <li>Tax consequences</li>
        <li>Contributions as homemaker</li>
        <li>Any valid agreement between parties</li>
      </ul>
      
      <h3>Modification and Termination</h3>
      <p>Maintenance can be modified or terminated if:</p>
      <ul>
        <li>There's a substantial change in circumstances</li>
        <li>The receiving spouse remarries</li>
        <li>The receiving spouse cohabitates with another person</li>
        <li>Either party dies</li>
      </ul>
      
      <h3>Tax Considerations</h3>
      <p>Note: Tax treatment of maintenance changed in 2019. For divorces finalized after 2018, maintenance payments are no longer tax-deductible for the payor, and recipients don't pay taxes on maintenance received.</p>
    `,
  },
  {
    title: "Prenuptial and Postnuptial Agreements in Illinois",
    slug: "prenups-in-illinois",
    category: "process",
    tags: ["prenup", "postnup", "agreements", "property", "maintenance"],
    published: true,
    content: `
      <h2>Prenuptial and Postnuptial Agreements in Illinois</h2>
      
      <p>Many Illinois couples sign written agreements before or during marriage that explain what happens with property, debts, and sometimes spousal maintenance if they later divorce. These are called <strong>prenuptial agreements</strong> (signed before marriage) and <strong>postnuptial agreements</strong> (signed after marriage).</p>
      
      <h3>What a Prenup or Postnup Can Cover</h3>
      <p>These agreements often address:</p>
      <ul>
        <li>Which property will stay with each spouse if there is a divorce</li>
        <li>How property or money acquired during the marriage will be treated</li>
        <li>Who will be responsible for certain debts</li>
        <li>Whether either spouse will receive spousal maintenance (alimony), and in some cases how much and for how long</li>
      </ul>
      
      <p>They <strong>cannot</strong> decide issues like child custody, parenting time, or child support in a way that is binding on the court. Those issues are always decided based on the best interests of the child and Illinois law at the time of the case.</p>
      
      <h3>How Illinois Courts Look at These Agreements</h3>
      <p>Whether a particular prenup or postnup will be followed by an Illinois court depends on the facts of the case and the language of the agreement. Courts may consider factors such as:</p>
      <ul>
        <li>Whether each spouse had a fair chance to review the agreement before signing</li>
        <li>Whether each spouse had the opportunity to talk with their own attorney</li>
        <li>Whether both spouses fully disclosed their income, property, and debts</li>
        <li>Whether the agreement was signed voluntarily, without pressure or threats</li>
        <li>Whether the terms are unconscionable (extremely one-sided) at the time of enforcement</li>
      </ul>
      
      <p>Courts can enforce some or all of an agreement, modify terms, or decline to enforce parts of it depending on the circumstances. Only a judge (or sometimes the parties with the help of their attorneys) can decide what will ultimately happen with your specific agreement.</p>
      
      <h3>Using NewStart IL if You Have a Prenup or Postnup</h3>
      <p>If you have a prenup or postnup, you can still use NewStart IL to:</p>
      <ul>
        <li>Stay organized about your finances, property, and debts</li>
        <li>Generate draft documents for an uncontested Illinois divorce</li>
        <li>Highlight where your preferred terms match or differ from your agreement</li>
      </ul>
      
      <p>Our tools can help you summarize the agreement in plain language and keep it in one place with your other case documents. However, NewStart IL does <strong>not</strong>:</p>
      <ul>
        <li>Decide whether your agreement is valid, enforceable, or fair</li>
        <li>Tell you whether to follow, change, or challenge your agreement</li>
        <li>Provide legal advice about your options</li>
      </ul>
      
      <h3>When to Talk to an Attorney</h3>
      <p>You should strongly consider speaking with an Illinois family law attorney if:</p>
      <ul>
        <li>You are unsure what your agreement means</li>
        <li>You felt pressured or unsafe when you signed it</li>
        <li>Your financial situation has changed significantly since signing</li>
        <li>One spouse wants to follow the agreement and the other does not</li>
      </ul>
      
      <p>An attorney can review your agreement, explain how Illinois law may apply, and help you understand your options. NewStart IL can help you get organized and prepared for that conversation.</p>
      
      <h3>Important Disclaimer</h3>
      <p>This page provides <strong>general information</strong> about prenuptial and postnuptial agreements in Illinois. It is <strong>not legal advice</strong>, does not create an attorney–client relationship, and may not apply to your specific situation. You should consult with an Illinois family law attorney for advice about your own agreement.</p>
    `,
  },
  {
    title: "Residency Requirements for Illinois Divorce",
    slug: "residency-requirements",
    category: "requirements",
    tags: ["residency", "requirements", "filing"],
    published: true,
    content: `
      <h2>Residency Requirements for Illinois Divorce</h2>
      
      <p>To file for divorce in Illinois, you must meet specific residency requirements.</p>
      
      <h3>90-Day Residency Rule</h3>
      <p><strong>At least one spouse must have lived in Illinois for at least 90 days</strong> before filing for divorce.</p>
      
      <h3>County Filing Requirements</h3>
      <p>You must file in a county where:</p>
      <ul>
        <li>Either spouse has lived for at least 90 days, OR</li>
        <li>The cause of action (grounds for divorce) arose</li>
      </ul>
      
      <h3>What Counts as "Living" in Illinois</h3>
      <p>To establish residency, you must:</p>
      <ul>
        <li>Physically be present in Illinois</li>
        <li>Intend to make Illinois your permanent home</li>
        <li>Have a physical address in Illinois</li>
      </ul>
      
      <h3>Military Exception</h3>
      <p>Military members stationed in Illinois may meet residency requirements even if they haven't lived there for the full 90 days, depending on their circumstances.</p>
      
      <h3>Proving Residency</h3>
      <p>You may need to provide proof of residency, such as:</p>
      <ul>
        <li>Illinois driver's license or state ID</li>
        <li>Voter registration</li>
        <li>Utility bills</li>
        <li>Lease or mortgage documents</li>
        <li>Employment records</li>
      </ul>
      
      <h3>What Happens If You Don't Meet Requirements</h3>
      <p>If you file without meeting residency requirements:</p>
      <ul>
        <li>The court may dismiss your case</li>
        <li>You'll lose your filing fee</li>
        <li>You'll need to wait until you meet the requirements</li>
      </ul>
      
      <h3>Moving During Divorce</h3>
      <p>If you move out of Illinois after filing but before the divorce is final, you may still be able to complete the divorce in Illinois if you maintain some connection to the state.</p>
    `,
  },
]

export async function seedLegalContent() {
  console.log("Seeding legal content...")

  for (const content of legalContent) {
    try {
      // Check if content already exists
      const existing = await prisma.legalContent.findUnique({
        where: { slug: content.slug },
      })

      if (existing) {
        console.log(`Skipping ${content.slug} - already exists`)
        continue
      }

      await prisma.legalContent.create({
        data: content,
      })

      console.log(`✓ Created: ${content.title}`)
    } catch (error) {
      console.error(`Error creating ${content.slug}:`, error)
    }
  }

  console.log("Legal content seeding complete!")
}

// Run if called directly
if (require.main === module) {
  seedLegalContent()
    .then(() => {
      console.log("Done!")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Error:", error)
      process.exit(1)
    })
}
