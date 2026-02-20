import { MainLayout } from "@/components/layouts/main-layout"
import { Glossary } from "@/components/legal/glossary"
import { Disclaimer } from "@/components/legal/disclaimer"

// Sample legal terms - in production, these would come from the database
const legalTerms = [
  {
    term: "Dissolution of Marriage",
    definition:
      "The legal term for divorce in Illinois. The court dissolves the marriage, ending the legal relationship between spouses.",
    category: "Process",
  },
  {
    term: "Petition for Dissolution",
    definition:
      "The initial document filed with the court to start the divorce process. It states the grounds for divorce and what the filing spouse is requesting.",
    category: "Documents",
  },
  {
    term: "Uncontested Divorce",
    definition:
      "A divorce where both spouses agree on all issues, including property division, child custody, and support. This is typically faster and less expensive.",
    category: "Process",
  },
  {
    term: "Contested Divorce",
    definition:
      "A divorce where spouses disagree on one or more issues. This requires court intervention and typically takes longer.",
    category: "Process",
  },
  {
    term: "Grounds for Divorce",
    definition:
      "The legal reason for seeking a divorce. In Illinois, the most common ground is 'irreconcilable differences' (no-fault divorce).",
    category: "Legal Terms",
  },
  {
    term: "Irreconcilable Differences",
    definition:
      "The no-fault ground for divorce in Illinois. It means the marriage has broken down and cannot be repaired, with no reasonable prospect of reconciliation.",
    category: "Legal Terms",
  },
  {
    term: "Residency Requirement",
    definition:
      "The requirement that at least one spouse must have lived in Illinois for at least 90 days before filing for divorce.",
    category: "Requirements",
  },
  {
    term: "Service of Process",
    definition:
      "The legal requirement to formally notify the other spouse that a divorce has been filed. This is typically done by a sheriff or process server.",
    category: "Process",
  },
  {
    term: "Marital Property",
    definition:
      "Property acquired during the marriage, regardless of which spouse's name is on the title. This is subject to division in divorce.",
    category: "Property",
  },
  {
    term: "Non-Marital Property",
    definition:
      "Property owned before marriage, inherited property, or property received as a gift. This is typically not divided in divorce.",
    category: "Property",
  },
  {
    term: "Child Custody",
    definition:
      "The legal right and responsibility to make decisions about a child's upbringing, including education, healthcare, and religious upbringing.",
    category: "Children",
  },
  {
    term: "Parenting Time",
    definition:
      "The schedule for when each parent spends time with the children. Formerly called 'visitation' in Illinois.",
    category: "Children",
  },
  {
    term: "Child Support",
    definition:
      "Financial support paid by one parent to the other for the benefit of the children. Amounts are calculated using Illinois guidelines.",
    category: "Children",
  },
  {
    term: "Spousal Maintenance",
    definition:
      "Financial support paid by one spouse to the other after divorce. Also called alimony. Amount and duration depend on various factors.",
    category: "Financial",
  },
  {
    term: "Financial Affidavit",
    definition:
      "A detailed form disclosing income, expenses, assets, and debts. Required in Illinois divorces to determine support and property division.",
    category: "Documents",
  },
  {
    term: "Marital Settlement Agreement",
    definition:
      "A written agreement between spouses outlining how they will divide property, handle custody, and resolve other divorce issues.",
    category: "Documents",
  },
  {
    term: "Discovery",
    definition:
      "The process of gathering information and documents from the other party during a contested divorce.",
    category: "Process",
  },
  {
    term: "Mediation",
    definition:
      "A process where a neutral third party helps spouses reach an agreement on divorce issues without going to trial.",
    category: "Process",
  },
  {
    term: "E-Filing",
    definition:
      "Electronic filing of court documents through the Illinois E-Services system, allowing filing without visiting the courthouse.",
    category: "Process",
  },
  {
    term: "Pro Se",
    definition:
      "Representing yourself in court without an attorney. Also called 'self-represented' or 'pro per'.",
    category: "Legal Terms",
  },
]

export default function GlossaryPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Legal Terms Glossary
          </h1>
          <p className="text-lg text-gray-600">
            Common legal terms related to Illinois divorce, explained in plain language.
          </p>
        </div>

        <Glossary terms={legalTerms} />

        <div className="mt-12">
          <Disclaimer />
        </div>
      </div>
    </MainLayout>
  )
}
