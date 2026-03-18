/**
 * Generate Illinois Marital Settlement Agreement PDF document
 */

import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib"

interface SettlementData {
  // Basic info
  "petitioner-name"?: string
  "petitionerName"?: string
  "respondent-name"?: string
  "respondentName"?: string
  "marriage-date"?: string
  "marriageDate"?: string
  "separation-date"?: string
  "separationDate"?: string
  "has-children"?: string
  "hasChildren"?: string

  // Real estate
  "has-marital-home"?: string
  "hasMaritalHome"?: string
  "marital-home-address"?: string
  "maritalHomeAddress"?: string
  "marital-home-value"?: number
  "maritalHomeValue"?: number
  "marital-home-mortgage"?: number
  "maritalHomeMortgage"?: number
  "marital-home-disposition"?: string
  "maritalHomeDisposition"?: string
  "home-buyout-amount"?: number
  "homeBuyoutAmount"?: number
  "split-percentage-petitioner"?: number
  "splitPercentagePetitioner"?: number

  // Vehicles
  "vehicle-1-description"?: string
  "vehicle1Description"?: string
  "vehicle-1-owner"?: string
  "vehicle1Owner"?: string
  "vehicle-2-description"?: string
  "vehicle2Description"?: string
  "vehicle-2-owner"?: string
  "vehicle2Owner"?: string

  // Financial accounts
  "bank-account-approach"?: string
  "bankAccountApproach"?: string
  "joint-account-balance"?: number
  "jointAccountBalance"?: number
  "joint-account-split"?: string
  "jointAccountSplit"?: string
  "retirement-division"?: string
  "retirementDivision"?: string

  // Debts
  "debt-approach"?: string
  "debtApproach"?: string
  "credit-card-debt-total"?: number
  "creditCardDebtTotal"?: number
  "credit-card-petitioner-responsibility"?: number
  "creditCardPetitionerResponsibility"?: number
  "credit-card-respondent-responsibility"?: number
  "creditCardRespondentResponsibility"?: number
  "other-debt-allocation"?: string
  "otherDebtAllocation"?: string

  // Spousal maintenance
  "maintenance-agreement"?: string
  "maintenanceAgreement"?: string
  "maintenance-amount"?: number
  "maintenanceAmount"?: number
  "maintenance-duration"?: number
  "maintenanceDuration"?: number
  "maintenance-modifiable"?: string
  "maintenanceModifiable"?: string

  // Child support
  "child-support-agreement"?: string
  "childSupportAgreement"?: string
  "child-support-amount"?: number
  "childSupportAmount"?: number
  "health-insurance-children"?: string
  "healthInsuranceChildren"?: string

  // Personal property
  "personal-property-approach"?: string
  "personalPropertyApproach"?: string
  "petitioner-keeps-items"?: string
  "petitionerKeepsItems"?: string
  "respondent-keeps-items"?: string
  "respondentKeepsItems"?: string

  // Final provisions
  "name-change"?: string
  "nameChange"?: string
  "name-to-restore"?: string
  "nameToRestore"?: string
  "attorney-fees"?: string
  "attorneyFees"?: string
  "additional-terms"?: string
  "additionalTerms"?: string

  // Prenup fields
  "hasPrenup"?: string
  "prenupType"?: string
  "prenupPreMaritalPropertyRule"?: string
  "prenupMaritalPropertyRule"?: string
  "prenupDebtRule"?: string
  "prenupMaintenanceTerms"?: string
  "prenupOtherKeyTerms"?: string
  "prenupFollowStatus"?: string
  // Uploaded prenup document references
  "uploadedPrenupDocuments"?: string[] // Array of uploaded prenup file names
}

// Helper to get value from either kebab-case or camelCase
function getValue<T>(data: SettlementData, kebab: string, camel: string): T | undefined {
  return (data as any)[kebab] ?? (data as any)[camel]
}

/**
 * Generate a Marital Settlement Agreement PDF document
 */
export async function generateSettlementAgreementPDF(
  data: SettlementData,
  generatedAt: Date = new Date()
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([612, 792]) // US Letter size

  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
  
  const fontSize = 11
  const lineHeight = 14
  let yPosition = 740
  let paragraphNum = 1

  const addText = (
    text: string,
    x: number,
    options: {
      font?: PDFFont
      size?: number
      color?: ReturnType<typeof rgb>
      centered?: boolean
    } = {}
  ) => {
    const textFont = options.font || font
    const textSize = options.size || fontSize
    let xPos = x
    
    if (options.centered) {
      const textWidth = textFont.widthOfTextAtSize(text, textSize)
      xPos = (612 - textWidth) / 2
    }
    
    page.drawText(text, {
      x: xPos,
      y: yPosition,
      size: textSize,
      font: textFont,
      color: options.color || rgb(0, 0, 0),
    })
  }

  const addParagraph = (title: string, content: string[]) => {
    checkNewPage()
    addText(`${paragraphNum}.`, 50, { font: boldFont })
    addText(title.toUpperCase(), 70, { font: boldFont })
    yPosition -= lineHeight + 5
    
    for (const line of content) {
      checkNewPage()
      // Word wrap long lines
      const words = line.split(" ")
      let currentLine = ""
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const width = font.widthOfTextAtSize(testLine, fontSize)
        if (width > 480) {
          addText(currentLine, 70)
          yPosition -= lineHeight
          checkNewPage()
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) {
        addText(currentLine, 70)
        yPosition -= lineHeight
      }
    }
    yPosition -= 10
    paragraphNum++
  }

  const checkNewPage = () => {
    if (yPosition < 80) {
      page = pdfDoc.addPage([612, 792])
      yPosition = 740
    }
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return "$0.00"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "_______________"
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  // Get values
  const petitionerName = getValue<string>(data, "petitioner-name", "petitionerName") || "_______________"
  const respondentName = getValue<string>(data, "respondent-name", "respondentName") || "_______________"
  const marriageDate = formatDate(getValue<string>(data, "marriage-date", "marriageDate"))
  const separationDate = formatDate(getValue<string>(data, "separation-date", "separationDate"))

  // === HEADER ===
  addText("IN THE CIRCUIT COURT OF ILLINOIS", 0, { font: boldFont, size: 12, centered: true })
  yPosition -= lineHeight + 10

  // Case caption
  addText("In re the Marriage of:", 50, { font: italicFont })
  yPosition -= lineHeight + 5
  addText(petitionerName.toUpperCase(), 50, { font: boldFont })
  addText(", Petitioner", 50 + boldFont.widthOfTextAtSize(petitionerName.toUpperCase(), fontSize) + 5, {})
  yPosition -= lineHeight
  addText("and", 50, {})
  yPosition -= lineHeight
  addText(respondentName.toUpperCase(), 50, { font: boldFont })
  addText(", Respondent", 50 + boldFont.widthOfTextAtSize(respondentName.toUpperCase(), fontSize) + 5, {})
  yPosition -= lineHeight + 5
  addText("Case No.: _______________", 400, {})
  yPosition -= lineHeight + 15

  // Title
  addText("MARITAL SETTLEMENT AGREEMENT", 0, { font: boldFont, size: 14, centered: true })
  yPosition -= lineHeight + 20

  // Check for prenup
  const hasPrenup = getValue<string>(data, "hasPrenup", "hasPrenup") === "yes"
  const prenupType = getValue<string>(data, "prenupType", "prenupType")
  const prenupFollowStatus = getValue<string>(data, "prenupFollowStatus", "prenupFollowStatus")

  // === INTRODUCTION ===
  const introLines = [
    `This Marital Settlement Agreement ("Agreement") is entered into between ${petitionerName} ("Petitioner") and ${respondentName} ("Respondent"), collectively referred to as "the Parties."`,
    `The Parties were married on ${marriageDate}.`,
    separationDate !== "_______________" ? `The Parties separated on or about ${separationDate}.` : "",
  ]

  // Add prenup reference if applicable
  if (hasPrenup) {
    const prenupTypeText = prenupType === "prenup" ? "prenuptial" : prenupType === "postnup" ? "postnuptial" : "prenuptial/postnuptial"
    introLines.push(`The Parties have a ${prenupTypeText} agreement and intend for the provisions of this Agreement to be consistent with that agreement, subject to court approval.`)
    
    if (prenupFollowStatus !== "both_follow") {
      introLines.push("The Parties acknowledge that certain terms may differ from the original agreement and have agreed to these modifications.")
    }
  }

  introLines.push("The Parties desire to settle all matters arising from their marriage, including the division of property, allocation of debts, and any other matters between them.")
  
  addParagraph("Introduction", introLines.filter(Boolean))

  // === PRENUPTIAL/POSTNUPTIAL AGREEMENT REFERENCE ===
  if (hasPrenup) {
    const prenupPreMarital = getValue<string>(data, "prenupPreMaritalPropertyRule", "prenupPreMaritalPropertyRule")
    const prenupMarital = getValue<string>(data, "prenupMaritalPropertyRule", "prenupMaritalPropertyRule")
    const prenupDebt = getValue<string>(data, "prenupDebtRule", "prenupDebtRule")
    const prenupMaintenance = getValue<string>(data, "prenupMaintenanceTerms", "prenupMaintenanceTerms")
    const prenupOther = getValue<string>(data, "prenupOtherKeyTerms", "prenupOtherKeyTerms")

    const prenupLines: string[] = []
    prenupLines.push("The Parties acknowledge that they have a prenuptial/postnuptial agreement that addresses certain aspects of property division, debt allocation, and/or spousal maintenance.")

    if (prenupPreMarital && prenupPreMarital !== "not_sure" && prenupPreMarital !== "not_addressed") {
      const prenupPreMaritalText = prenupPreMarital === "each_keeps_own" 
        ? "Each party retains property owned before marriage"
        : prenupPreMarital === "some_shared"
        ? "Some pre-marital property is shared or split"
        : "Most property is treated as shared/marital"
      prenupLines.push(`Regarding pre-marital property: ${prenupPreMaritalText}.`)
    }

    if (prenupMarital && prenupMarital !== "not_sure" && prenupMarital !== "not_addressed") {
      const prenupMaritalText = prenupMarital === "each_keeps_own"
        ? "Each party keeps property in their own name"
        : prenupMarital === "mixed"
        ? "Some property is shared/split, others are separate"
        : "Most or all property is shared/split"
      prenupLines.push(`Regarding marital property: ${prenupMaritalText}.`)
    }

    if (prenupDebt && prenupDebt !== "not_sure" && prenupDebt !== "not_addressed") {
      const prenupDebtText = prenupDebt === "each_keeps_own"
        ? "Each party is responsible for debts in their own name"
        : "Most debts are shared/split"
      prenupLines.push(`Regarding debts: ${prenupDebtText}.`)
    }

    if (prenupMaintenance && prenupMaintenance !== "not_sure" && prenupMaintenance !== "not_addressed") {
      if (prenupMaintenance === "waiver") {
        prenupLines.push("The prenuptial/postnuptial agreement provides for a waiver of spousal maintenance.")
      } else if (prenupMaintenance === "formula_or_amount") {
        prenupLines.push("The prenuptial/postnuptial agreement sets specific terms for spousal maintenance.")
      } else if (prenupMaintenance === "refer_to_law") {
        prenupLines.push("The prenuptial/postnuptial agreement leaves maintenance to Illinois law and court decisions.")
      }
    }

    if (prenupOther) {
      prenupLines.push(`Additional terms from the agreement: ${prenupOther}`)
    }

    prenupLines.push("The provisions of this Marital Settlement Agreement are intended to be consistent with the prenuptial/postnuptial agreement, subject to court approval and any modifications agreed upon by the Parties.")

    // Add reference to uploaded prenup documents if any
    const uploadedPrenupDocs = getValue<string[]>(data, "uploadedPrenupDocuments", "uploadedPrenupDocuments");
    if (uploadedPrenupDocs && uploadedPrenupDocs.length > 0) {
      prenupLines.push("");
      prenupLines.push("The Parties have uploaded the following prenuptial/postnuptial agreement document(s) with this case:");
      uploadedPrenupDocs.forEach((fileName) => {
        prenupLines.push(`  • ${fileName}`);
      });
      prenupLines.push("These documents are available for reference and should be provided to the court if requested.");
    }

    addParagraph("Prenuptial/Postnuptial Agreement", prenupLines)
  }

  // === REAL ESTATE ===
  const hasHome = getValue<string>(data, "has-marital-home", "hasMaritalHome") === "yes"
  if (hasHome) {
    const disposition = getValue<string>(data, "marital-home-disposition", "maritalHomeDisposition")
    const homeValue = getValue<number>(data, "marital-home-value", "maritalHomeValue")
    const mortgage = getValue<number>(data, "marital-home-mortgage", "maritalHomeMortgage")
    const address = getValue<string>(data, "marital-home-address", "maritalHomeAddress")
    
    let dispositionText = ""
    switch (disposition) {
      case "petitioner_keeps":
        dispositionText = `Petitioner shall retain the marital home. Petitioner shall be solely responsible for the mortgage and shall hold Respondent harmless from any obligations related to the property.`
        break
      case "respondent_keeps":
        dispositionText = `Respondent shall retain the marital home. Respondent shall be solely responsible for the mortgage and shall hold Petitioner harmless from any obligations related to the property.`
        break
      case "sell_split":
        dispositionText = `The marital home shall be listed for sale within 90 days. The net proceeds (after payment of mortgage, closing costs, and realtor fees) shall be divided equally (50/50) between the Parties.`
        break
      case "sell_unequal":
        const petPct = getValue<number>(data, "split-percentage-petitioner", "splitPercentagePetitioner") || 50
        dispositionText = `The marital home shall be listed for sale. The net proceeds shall be divided ${petPct}% to Petitioner and ${100 - petPct}% to Respondent.`
        break
      case "buyout":
        const buyout = getValue<number>(data, "home-buyout-amount", "homeBuyoutAmount")
        dispositionText = `One party shall buy out the other's interest in the marital home for ${formatCurrency(buyout)}, to be paid within 90 days of the entry of the Judgment of Dissolution.`
        break
    }
    
    addParagraph("Real Estate", [
      address ? `The marital home is located at: ${address}` : "The Parties own a marital home.",
      homeValue ? `Estimated market value: ${formatCurrency(homeValue)}` : "",
      mortgage ? `Remaining mortgage balance: ${formatCurrency(mortgage)}` : "",
      dispositionText,
    ].filter(Boolean))
  } else {
    addParagraph("Real Estate", [
      "The Parties do not own any real estate subject to division in this Agreement.",
    ])
  }

  // === VEHICLES ===
  const vehicle1 = getValue<string>(data, "vehicle-1-description", "vehicle1Description")
  const vehicle1Owner = getValue<string>(data, "vehicle-1-owner", "vehicle1Owner")
  const vehicle2 = getValue<string>(data, "vehicle-2-description", "vehicle2Description")
  const vehicle2Owner = getValue<string>(data, "vehicle-2-owner", "vehicle2Owner")

  const vehicleLines: string[] = []
  if (vehicle1) {
    const owner = vehicle1Owner === "petitioner" ? "Petitioner" : vehicle1Owner === "respondent" ? "Respondent" : "to be sold"
    vehicleLines.push(`${vehicle1}: Awarded to ${owner}. The receiving party shall be responsible for any remaining loan balance.`)
  }
  if (vehicle2) {
    const owner = vehicle2Owner === "petitioner" ? "Petitioner" : vehicle2Owner === "respondent" ? "Respondent" : "to be sold"
    vehicleLines.push(`${vehicle2}: Awarded to ${owner}. The receiving party shall be responsible for any remaining loan balance.`)
  }
  if (vehicleLines.length === 0) {
    vehicleLines.push("Each party shall retain any vehicle currently titled in their individual name.")
  }
  addParagraph("Vehicles", vehicleLines)

  // === FINANCIAL ACCOUNTS ===
  const bankApproach = getValue<string>(data, "bank-account-approach", "bankAccountApproach")
  const jointBalance = getValue<number>(data, "joint-account-balance", "jointAccountBalance")
  const jointSplit = getValue<string>(data, "joint-account-split", "jointAccountSplit")
  const retirementDiv = getValue<string>(data, "retirement-division", "retirementDivision")

  const financeLines: string[] = []
  if (bankApproach === "keep_own") {
    financeLines.push("Each party shall retain all bank accounts currently held in their individual name.")
  } else if (bankApproach === "split_equal") {
    financeLines.push("All bank accounts shall be divided equally (50/50) between the Parties.")
  } else {
    financeLines.push("Bank accounts shall be divided as agreed between the Parties.")
  }
  
  if (jointBalance && jointBalance > 0) {
    const splitDesc = jointSplit === "fifty_fifty" ? "equally (50/50)" : 
                      jointSplit === "sixty_forty_p" ? "60% to Petitioner, 40% to Respondent" :
                      jointSplit === "sixty_forty_r" ? "40% to Petitioner, 60% to Respondent" :
                      "as agreed"
    financeLines.push(`Joint accounts totaling ${formatCurrency(jointBalance)} shall be divided ${splitDesc}.`)
  }

  if (retirementDiv === "keep_own") {
    financeLines.push("Each party shall retain their own retirement accounts without division.")
  } else if (retirementDiv === "qdro_split") {
    financeLines.push("Retirement accounts acquired during the marriage shall be divided equally via Qualified Domestic Relations Order (QDRO).")
  } else if (retirementDiv === "offset") {
    financeLines.push("Retirement account values shall be offset against other marital assets.")
  }

  addParagraph("Financial Accounts", financeLines)

  // === DEBTS ===
  const debtApproach = getValue<string>(data, "debt-approach", "debtApproach")
  const ccTotal = getValue<number>(data, "credit-card-debt-total", "creditCardDebtTotal")
  const ccPetitioner = getValue<number>(data, "credit-card-petitioner-responsibility", "creditCardPetitionerResponsibility")
  const ccRespondent = getValue<number>(data, "credit-card-respondent-responsibility", "creditCardRespondentResponsibility")
  const otherDebtAlloc = getValue<string>(data, "other-debt-allocation", "otherDebtAllocation")

  const debtLines: string[] = []
  if (debtApproach === "own_debts") {
    debtLines.push("Each party shall be responsible for debts incurred in their individual name.")
  } else if (debtApproach === "split_equal") {
    debtLines.push("All marital debts shall be divided equally (50/50) between the Parties.")
  }

  if (ccTotal && ccTotal > 0) {
    if (ccPetitioner && ccRespondent) {
      debtLines.push(`Credit card debt of ${formatCurrency(ccTotal)}: Petitioner responsible for ${formatCurrency(ccPetitioner)}; Respondent responsible for ${formatCurrency(ccRespondent)}.`)
    } else {
      debtLines.push(`Total credit card debt: ${formatCurrency(ccTotal)} to be allocated as agreed.`)
    }
  }

  if (otherDebtAlloc) {
    debtLines.push(`Other debts: ${otherDebtAlloc}`)
  }

  if (debtLines.length === 0) {
    debtLines.push("Each party shall be responsible for debts in their own name. Neither party shall incur debt in the other's name.")
  }

  addParagraph("Allocation of Debts", debtLines)

  // === SPOUSAL MAINTENANCE ===
  const maintAgreement = getValue<string>(data, "maintenance-agreement", "maintenanceAgreement")
  const maintAmount = getValue<number>(data, "maintenance-amount", "maintenanceAmount")
  const maintDuration = getValue<number>(data, "maintenance-duration", "maintenanceDuration")
  const maintModifiable = getValue<string>(data, "maintenance-modifiable", "maintenanceModifiable")

  const maintLines: string[] = []
  if (maintAgreement === "none") {
    maintLines.push("Neither party shall pay spousal maintenance to the other.")
    maintLines.push("Each party hereby waives any right to spousal maintenance, now and in the future.")
  } else if (maintAgreement === "reserved") {
    maintLines.push("The issue of spousal maintenance is reserved for future determination by the Court.")
  } else if (maintAgreement === "petitioner_pays" || maintAgreement === "respondent_pays") {
    const payer = maintAgreement === "petitioner_pays" ? "Petitioner" : "Respondent"
    const payee = maintAgreement === "petitioner_pays" ? "Respondent" : "Petitioner"
    maintLines.push(`${payer} shall pay ${payee} spousal maintenance in the amount of ${formatCurrency(maintAmount)} per month.`)
    
    if (maintDuration && maintDuration > 0) {
      const years = Math.floor(maintDuration / 12)
      const months = maintDuration % 12
      const durationStr = years > 0 ? `${years} year${years > 1 ? "s" : ""}${months > 0 ? ` and ${months} month${months > 1 ? "s" : ""}` : ""}` : `${months} month${months > 1 ? "s" : ""}`
      maintLines.push(`Maintenance shall continue for a period of ${durationStr}.`)
    } else {
      maintLines.push("Maintenance shall continue until further order of the Court.")
    }

    maintLines.push(`This maintenance obligation ${maintModifiable === "yes" ? "is" : "is not"} modifiable.`)
    maintLines.push("Maintenance shall terminate upon the death of either party, remarriage of the receiving party, or cohabitation of the receiving party with another person on a resident, continuing conjugal basis.")
  }

  addParagraph("Spousal Maintenance", maintLines)

  // === CHILD SUPPORT ===
  const csAgreement = getValue<string>(data, "child-support-agreement", "childSupportAgreement")
  const hasChildren = getValue<string>(data, "has-children", "hasChildren") === "yes"

  if (hasChildren && csAgreement && csAgreement !== "na") {
    const csAmount = getValue<number>(data, "child-support-amount", "childSupportAmount")
    const healthIns = getValue<string>(data, "health-insurance-children", "healthInsuranceChildren")

    const csLines: string[] = []
    if (csAgreement === "none") {
      csLines.push("Due to equal parenting time, no child support shall be exchanged between the Parties.")
    } else if (csAgreement === "guidelines") {
      csLines.push("Child support shall be calculated pursuant to Illinois statutory guidelines based on the parties' incomes and parenting time.")
    } else {
      const payer = csAgreement === "petitioner_pays" ? "Petitioner" : "Respondent"
      const payee = csAgreement === "petitioner_pays" ? "Respondent" : "Petitioner"
      csLines.push(`${payer} shall pay ${payee} child support in the amount of ${formatCurrency(csAmount)} per month.`)
    }

    if (healthIns === "petitioner") {
      csLines.push("Petitioner shall provide health insurance for the minor children.")
    } else if (healthIns === "respondent") {
      csLines.push("Respondent shall provide health insurance for the minor children.")
    } else if (healthIns === "both") {
      csLines.push("The Parties shall share the cost of health insurance for the minor children.")
    }

    csLines.push("Uncovered medical, dental, and vision expenses for the children shall be divided between the Parties in proportion to their respective incomes.")

    addParagraph("Child Support", csLines)
  }

  // === PERSONAL PROPERTY ===
  const propApproach = getValue<string>(data, "personal-property-approach", "personalPropertyApproach")
  const petItems = getValue<string>(data, "petitioner-keeps-items", "petitionerKeepsItems")
  const respItems = getValue<string>(data, "respondent-keeps-items", "respondentKeepsItems")

  const propLines: string[] = []
  if (propApproach === "already_divided") {
    propLines.push("The Parties have already divided their personal property to their mutual satisfaction.")
    propLines.push("Each party shall retain all personal property currently in their possession.")
  } else if (propApproach === "list_items") {
    if (petItems) propLines.push(`Petitioner shall retain: ${petItems}`)
    if (respItems) propLines.push(`Respondent shall retain: ${respItems}`)
  } else {
    propLines.push("Personal property shall be divided by agreement of the Parties.")
  }

  addParagraph("Personal Property", propLines)

  // === NAME RESTORATION ===
  const nameChange = getValue<string>(data, "name-change", "nameChange") === "yes"
  const nameToRestore = getValue<string>(data, "name-to-restore", "nameToRestore")

  if (nameChange && nameToRestore) {
    addParagraph("Name Restoration", [
      `${nameToRestore === petitionerName ? "Petitioner" : "Respondent"} shall be restored to the former name of ${nameToRestore}.`,
    ])
  }

  // === ATTORNEY FEES ===
  const fees = getValue<string>(data, "attorney-fees", "attorneyFees")
  const feeLines: string[] = []
  if (fees === "own") {
    feeLines.push("Each party shall be responsible for their own attorney fees and costs.")
  } else if (fees === "petitioner") {
    feeLines.push("Petitioner shall pay all attorney fees and costs incurred by both parties.")
  } else if (fees === "respondent") {
    feeLines.push("Respondent shall pay all attorney fees and costs incurred by both parties.")
  } else if (fees === "split") {
    feeLines.push("Attorney fees and costs shall be divided equally between the Parties.")
  }
  addParagraph("Attorney Fees", feeLines)

  // === ADDITIONAL TERMS ===
  const additionalTerms = getValue<string>(data, "additional-terms", "additionalTerms")
  if (additionalTerms) {
    addParagraph("Additional Terms", [additionalTerms])
  }

  // === GENERAL PROVISIONS ===
  addParagraph("General Provisions", [
    "This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations and agreements.",
    "This Agreement may only be modified by written agreement signed by both Parties.",
    "Each party acknowledges that they have had the opportunity to consult with independent legal counsel before signing this Agreement.",
    "Both Parties agree to execute any documents necessary to effectuate the terms of this Agreement.",
  ])

  checkNewPage()
  yPosition -= 20

  // === SIGNATURE BLOCKS ===
  addText("IN WITNESS WHEREOF, the Parties have executed this Agreement.", 50, {})
  yPosition -= lineHeight + 30

  // Petitioner signature
  page.drawLine({
    start: { x: 50, y: yPosition + 5 },
    end: { x: 250, y: yPosition + 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText(petitionerName, 50, {})
  yPosition -= lineHeight
  addText("Petitioner", 50, { font: italicFont })
  yPosition -= lineHeight
  addText("Date: _______________", 50, {})
  yPosition -= lineHeight + 20

  // Respondent signature
  page.drawLine({
    start: { x: 50, y: yPosition + 5 },
    end: { x: 250, y: yPosition + 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText(respondentName, 50, {})
  yPosition -= lineHeight
  addText("Respondent", 50, { font: italicFont })
  yPosition -= lineHeight
  addText("Date: _______________", 50, {})
  yPosition -= lineHeight + 30

  // === FOOTER / DISCLAIMER ===
  checkNewPage()
  
  page.drawLine({
    start: { x: 50, y: 70 },
    end: { x: 562, y: 70 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })

  yPosition = 55
  addText(
    "DISCLAIMER: This document was generated by FreshStart IL for informational purposes only.",
    50,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= 10
  addText(
    "This is not legal advice. Please consult with an attorney before signing or filing with the court.",
    50,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= 10
  addText(
    `Generated: ${generatedAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`,
    50,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
