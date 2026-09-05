/**
 * Dependency-injected factory for the document-package handler.
 *
 * SERVER ONLY.
 *
 * Extracted from `app/api/documents/package/route.ts` so the real handler —
 * including the exact bytes it writes into the archive — can be exercised in
 * tests without a shared database, real credentials, or mutable globals. The
 * production route supplies the real auth, row selection, county lookup,
 * clock, and pinned renewal evidence; tests inject their own.
 *
 * Two gates apply to the federal IWO, and they are independent:
 *   - POLICY (authoritative county + federal currentness) authorizes the FORM;
 *   - PAYLOAD (exact pinned SHA-256 and byte length) authorizes the BYTES.
 * A row that passes policy but holds e.g. `%PDF-FAKE` is withheld and
 * disclosed. Unverified IWO bytes never enter the archive.
 */
import { NextResponse } from "next/server"
import JSZip from "jszip"

import { getCountyById, getCountyInstructions } from "@/lib/counties/illinois-counties"
import { getDisclaimerText } from "@/components/legal/disclaimer"
import { filterIwoFromPackage, isIwoDocument } from "@/lib/forms/iwo-package-guard"
import type { IwoRenewalEvidence } from "@/lib/forms/iwo-provenance"
import type { IwoOpenPathDisclosureApproval } from "@/lib/forms/iwo-distribution-hold"

export interface PackageDocumentRow {
  id?: string
  type: string
  fileName: string
  content: string | null
  mimeType: string | null
  generatedAt: Date
}

export interface PackageHandlerDeps {
  /** Returns the authenticated user id, or null. */
  getUserId: () => Promise<string | null>
  /** Rows already filtered to status 'ready'. */
  loadReadyDocuments: (userId: string) => Promise<PackageDocumentRow[]>
  /** Authoritative stored county for the case. May be free text. */
  loadStoredCounty: (userId: string) => Promise<string | null | undefined>
  loadUser: (userId: string) => Promise<{ name: string | null; email: string | null } | null>
  now?: () => Date
  /** Injected ONLY by test factories. */
  renewalEvidence?: IwoRenewalEvidence
  /** Injected ONLY by test factories. */
  artifactDir?: string
  /** Injected ONLY by test factories. Defaults to the pinned `pending` hold. */
  disclosureApproval?: IwoOpenPathDisclosureApproval
}

export function createDocumentPackageHandler(deps: PackageHandlerDeps) {
  return async function GET(): Promise<NextResponse> {
    try {
      const userId = await deps.getUserId()
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const now = deps.now?.() ?? new Date()

      const readyDocuments = await deps.loadReadyDocuments(userId)

      // Distinguish "nothing to package" from "everything was withheld".
      // Only the former is a 404; the latter must still disclose.
      if (readyDocuments.length === 0) {
        return NextResponse.json(
          { error: "No documents found. Please generate documents first." },
          { status: 404 }
        )
      }

      const storedCounty = await deps.loadStoredCounty(userId)

      const iwoFilter = filterIwoFromPackage(readyDocuments, {
        storedCounty,
        today: now,
        renewalEvidence: deps.renewalEvidence,
        artifactDir: deps.artifactDir,
        disclosureApproval: deps.disclosureApproval,
      })
      const documents = iwoFilter.included

      const user = await deps.loadUser(userId)

      const zip = new JSZip()
      const documentsFolder = zip.folder("documents")
      if (!documentsFolder) {
        throw new Error("Failed to create documents folder in ZIP")
      }

      const documentList: Array<{ name: string; type: string; date: string }> = []
      const lateWithheld: Array<{ doc: PackageDocumentRow; reason: string }> = []

      for (const doc of documents) {
        try {
          if (!doc.content) {
            console.warn(`Skipping document ${doc.fileName}: no content`)
            continue
          }

          let content: Buffer | string
          if (doc.mimeType === 'application/pdf') {
            content = Buffer.from(doc.content, 'base64')
          } else {
            content = doc.content
          }

          // Defense in depth: nothing classified as an IWO may be written here
          // unless it also cleared the payload pin above. If the filter ever
          // regresses, this refuses rather than emitting unverified bytes.
          if (isIwoDocument(doc)) {
            const { validateIwoPayload } = await import("@/lib/forms/iwo-package-guard")
            const check = validateIwoPayload(doc)
            if (!check.ok) {
              lateWithheld.push({ doc, reason: check.reason })
              continue
            }
            content = check.bytes
          }

          documentsFolder.file(doc.fileName, content)

          documentList.push({
            name: doc.fileName,
            type: formatDocumentType(doc.type),
            date: doc.generatedAt.toLocaleDateString('en-US'),
          })
        } catch (err) {
          console.error(`Failed to add document ${doc.fileName} to ZIP:`, err)
        }
      }

      const coverSheet = generateCoverSheet({
        userName: user?.name || 'User',
        userEmail: user?.email || '',
        // Only what was actually written. Never claims a withheld item.
        documents: documentList,
        county: storedCounty || undefined,
        generatedDate: now,
      })
      zip.file("00_COVER_SHEET.txt", coverSheet)

      const withheld = [
        ...iwoFilter.withheld,
        ...lateWithheld,
      ]
      if (withheld.length > 0) {
        const notice = iwoFilter.notice ?? [
          "An item stored on this account did not match the verified federal print and was not included.",
          "This is procedural information about file verification, not legal advice.",
        ]
        zip.file(
          "00_WITHHELD_ITEMS.txt",
          [
            "ITEMS NOT INCLUDED IN THIS PACKAGE",
            "",
            ...withheld.map((w) => `- ${w.doc.fileName} (${w.reason})`),
            "",
            ...notice,
            "",
          ].join("\n"),
        )
      }

      const filingInstructions = generateFilingInstructions(storedCounty || undefined)
      zip.file("01_FILING_INSTRUCTIONS.txt", filingInstructions)

      const checklist = generateFilingChecklist(documentList.map(d => d.type))
      zip.file("02_FILING_CHECKLIST.txt", checklist)

      const zipContent = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      })

      const dateStr = now.toISOString().split('T')[0]
      const fileName = `FreshStart_IL_Documents_${dateStr}.zip`

      return new NextResponse(new Uint8Array(zipContent), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': zipContent.length.toString(),
        },
      })
    } catch (error) {
      console.error("Error creating document package:", error)
      return NextResponse.json(
        { error: "Failed to create document package" },
        { status: 500 }
      )
    }
  }
}

/**
 * Format document type for display
 */
function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'petition': 'Petition for Dissolution of Marriage',
    'petition-no-children': 'Petition for Dissolution (No Children)',
    'petition-with-children': 'Petition for Dissolution (With Children)',
    'financial-affidavit': 'Financial Affidavit',
    'financial_affidavit': 'Financial Affidavit',
    'parenting-plan': 'Parenting Plan',
    'parenting_plan': 'Parenting Plan',
    'marital-settlement': 'Marital Settlement Agreement',
    'marital_settlement': 'Marital Settlement Agreement',
  }
  
  return typeMap[type] || type.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Generate cover sheet content
 */
function generateCoverSheet(params: {
  userName: string
  userEmail: string
  documents: Array<{ name: string; type: string; date: string }>
  county?: string
  generatedDate: Date
}): string {
  const { userName, userEmail, documents, county, generatedDate } = params
  
  const lines: string[] = [
    '═'.repeat(70),
    '                    FRESHSTART IL DOCUMENT PACKAGE',
    '═'.repeat(70),
    '',
    `Prepared for: ${userName}`,
    `Email: ${userEmail}`,
    `Package Created: ${generatedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    county ? `Filing County: ${county}` : '',
    '',
    '─'.repeat(70),
    '                         DOCUMENTS INCLUDED',
    '─'.repeat(70),
    '',
  ]

  documents.forEach((doc, index) => {
    lines.push(`  ${index + 1}. ${doc.type}`)
    lines.push(`     File: ${doc.name}`)
    lines.push(`     Generated: ${doc.date}`)
    lines.push('')
  })

  lines.push('─'.repeat(70))
  lines.push('                         IMPORTANT NOTES')
  lines.push('─'.repeat(70))
  lines.push('')
  lines.push('  1. Review all documents carefully before filing')
  lines.push('  2. Sign documents where indicated')
  lines.push('  3. Make copies for your records')
  lines.push('  4. Check county-specific requirements')
  lines.push('  5. Pay required filing fees')
  lines.push('')
  lines.push('─'.repeat(70))
  lines.push('                           DISCLAIMER')
  lines.push('─'.repeat(70))
  lines.push('')
  lines.push(getDisclaimerText())
  lines.push('')
  lines.push('═'.repeat(70))

  return lines.join('\n')
}

/**
 * Generate filing instructions
 */
function generateFilingInstructions(county?: string): string {
  const lines: string[] = [
    '═'.repeat(70),
    '                      FILING INSTRUCTIONS',
    '═'.repeat(70),
    '',
    'STEP 1: REVIEW YOUR DOCUMENTS',
    '─'.repeat(35),
    '  - Read through each document carefully',
    '  - Verify all names, dates, and addresses are correct',
    '  - Ensure all required information is complete',
    '  - Make any necessary corrections BEFORE filing',
    '',
    'STEP 2: SIGN YOUR DOCUMENTS',
    '─'.repeat(35),
    '  - Sign and date documents where indicated',
    '  - Some documents may require notarization',
    '  - Do NOT sign the Summons (the clerk will do this)',
    '',
    'STEP 3: MAKE COPIES',
    '─'.repeat(35),
    '  - Original: File with the court',
    '  - Copy 1: For your spouse (to be served)',
    '  - Copy 2: For your records',
    '',
    'STEP 4: FILE WITH THE COURT',
    '─'.repeat(35),
  ]

  if (county) {
    const countyInfo = getCountyById(county)
    if (countyInfo) {
      lines.push(`  County: ${countyInfo.name}`)
      lines.push(`  Court: ${countyInfo.fullName}`)
      lines.push(`  Address: ${countyInfo.courtAddress}`)
      lines.push(`           ${countyInfo.courtCity}, IL ${countyInfo.courtZip}`)
      if (countyInfo.courtPhone) {
        lines.push(`  Phone: ${countyInfo.courtPhone}`)
      }
      lines.push('')
      
      if (countyInfo.eFilingRequired) {
        lines.push('  *** E-FILING IS REQUIRED ***')
        if (countyInfo.eFilingUrl) {
          lines.push(`  E-Filing Portal: ${countyInfo.eFilingUrl}`)
        }
      }
      
      lines.push('')
      lines.push('  Filing Fees:')
      lines.push(`    Petition: $${countyInfo.fees.petitionFiling}`)
      lines.push(`    Response: $${countyInfo.fees.responseFiling}`)
      if (countyInfo.fees.feeWaiverAvailable) {
        lines.push('    Fee Waiver: Available if you qualify')
      }
      
      const instructions = getCountyInstructions(county)
      if (instructions.length > 0) {
        lines.push('')
        lines.push('  County-Specific Requirements:')
        instructions.forEach(inst => {
          lines.push(`    - ${inst}`)
        })
      }
    }
  } else {
    lines.push('  - Contact your local circuit court clerk for specific')
    lines.push('    filing procedures and fees')
    lines.push('  - Most Illinois counties require e-filing')
    lines.push('  - Standard petition filing fee is approximately $337')
  }

  lines.push('')
  lines.push('STEP 5: SERVE YOUR SPOUSE',
  '─'.repeat(35))
  lines.push('  After filing, your spouse must be officially served:')
  lines.push('  - Sheriff service (most common)')
  lines.push('  - Special process server')
  lines.push('  - Waiver of service (if spouse agrees)')
  lines.push('')
  lines.push('STEP 6: ATTEND COURT DATES',
  '─'.repeat(35))
  lines.push('  - Keep track of all court dates')
  lines.push('  - Arrive early and dress appropriately')
  lines.push('  - Bring copies of all filed documents')
  lines.push('')
  lines.push('═'.repeat(70))
  lines.push('')
  lines.push('For more information, visit our E-Filing Guide at:')
  lines.push('https://freshstart-il.com/dashboard/efiling')
  lines.push('')
  lines.push('═'.repeat(70))

  return lines.join('\n')
}

/**
 * Generate filing checklist
 */
function generateFilingChecklist(documentTypes: string[]): string {
  const lines: string[] = [
    '═'.repeat(70),
    '                        FILING CHECKLIST',
    '═'.repeat(70),
    '',
    'Use this checklist to ensure you have completed all necessary steps.',
    '',
    'BEFORE FILING:',
    '─'.repeat(35),
    '[ ] All questionnaires completed',
    '[ ] All documents generated',
    '[ ] Documents reviewed for accuracy',
    '[ ] Documents signed where required',
    '[ ] Made copies (original + 2 copies)',
    '',
    'DOCUMENTS TO FILE:',
    '─'.repeat(35),
  ]

  // Add document-specific items
  if (documentTypes.includes('petition') || documentTypes.includes('petition-no-children') || documentTypes.includes('petition-with-children')) {
    lines.push('[ ] Petition for Dissolution of Marriage')
    lines.push('[ ] Summons')
  }
  
  if (documentTypes.includes('financial-affidavit') || documentTypes.includes('financial_affidavit')) {
    lines.push('[ ] Financial Affidavit')
    lines.push('[ ] Supporting schedules (if applicable)')
  }
  
  if (documentTypes.includes('parenting-plan') || documentTypes.includes('parenting_plan')) {
    lines.push('[ ] Parenting Plan')
    lines.push('[ ] Parenting education certificate (if required)')
  }
  
  if (documentTypes.includes('marital-settlement') || documentTypes.includes('marital_settlement')) {
    lines.push('[ ] Marital Settlement Agreement')
  }

  lines.push('')
  lines.push('AT THE COURTHOUSE / E-FILING:',
  '─'.repeat(35))
  lines.push('[ ] Pay filing fee (or submit fee waiver)')
  lines.push('[ ] Receive case number')
  lines.push('[ ] Get file-stamped copies')
  lines.push('[ ] Schedule service on spouse')
  lines.push('')
  lines.push('AFTER FILING:',
  '─'.repeat(35))
  lines.push('[ ] Serve spouse with papers')
  lines.push('[ ] File proof of service')
  lines.push('[ ] Calendar court dates')
  lines.push('[ ] Prepare for hearing/trial')
  lines.push('')
  lines.push('═'.repeat(70))
  lines.push('')
  lines.push('Questions? Visit https://freshstart-il.com/legal-info/faq')
  lines.push('')

  return lines.join('\n')
}
