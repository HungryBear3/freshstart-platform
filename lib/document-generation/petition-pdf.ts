/**
 * Generate Illinois Divorce Petition PDF document
 */

import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib"

interface PetitionData {
  // Petitioner info
  "petitioner-first-name"?: string
  "petitioner-last-name"?: string
  "petitioner-address"?: string
  "petitioner-county"?: string
  
  // Spouse info
  "spouse-first-name"?: string
  "spouse-last-name"?: string
  "spouse-address"?: string
  
  // Marriage info
  "marriage-date"?: string
  "separation-date"?: string
  
  // Grounds
  "grounds-type"?: string
  "irreconcilable-duration"?: number
  
  // Children
  "has-children"?: string
  
  // Residency
  "residency-duration-months"?: number
}

/**
 * Generate a Petition for Dissolution of Marriage PDF document
 */
export async function generatePetitionPDF(
  data: PetitionData,
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

  const addLine = () => {
    page.drawLine({
      start: { x: 50, y: yPosition + 5 },
      end: { x: 562, y: yPosition + 5 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    })
    yPosition -= 10
  }

  const checkNewPage = () => {
    if (yPosition < 80) {
      page = pdfDoc.addPage([612, 792])
      yPosition = 740
    }
  }

  // === HEADER ===
  addText("IN THE CIRCUIT COURT OF THE", 0, { font: boldFont, size: 12, centered: true })
  yPosition -= lineHeight + 2
  
  const countyName = formatCounty(data["petitioner-county"] || "___________")
  addText(`${countyName.toUpperCase()} JUDICIAL CIRCUIT`, 0, { font: boldFont, size: 12, centered: true })
  yPosition -= lineHeight + 2
  
  addText(`${countyName.toUpperCase()} COUNTY, ILLINOIS`, 0, { font: boldFont, size: 12, centered: true })
  yPosition -= lineHeight + 15

  // === CASE CAPTION ===
  const petitionerName = `${data["petitioner-first-name"] || "___________"} ${data["petitioner-last-name"] || "___________"}`
  const respondentName = `${data["spouse-first-name"] || "___________"} ${data["spouse-last-name"] || "___________"}`

  addText("In re the Marriage of:", 50, { font: italicFont })
  yPosition -= lineHeight + 10

  addText(petitionerName.toUpperCase(), 50, { font: boldFont })
  yPosition -= lineHeight
  addText("Petitioner,", 100, {})
  yPosition -= lineHeight + 5

  addText("and", 50, {})
  yPosition -= lineHeight + 5

  addText(respondentName.toUpperCase(), 50, { font: boldFont })
  yPosition -= lineHeight
  addText("Respondent.", 100, {})
  yPosition -= lineHeight + 5

  // Case number placeholder on right side
  page.drawText("Case No.: _______________", {
    x: 400,
    y: yPosition + 60,
    size: fontSize,
    font: font,
  })

  yPosition -= 10
  addLine()
  yPosition -= 10

  // === TITLE ===
  addText("PETITION FOR DISSOLUTION OF MARRIAGE", 0, { font: boldFont, size: 14, centered: true })
  yPosition -= lineHeight + 15

  // === PETITIONER SECTION ===
  addText("NOW COMES the Petitioner, " + petitionerName + ", and states as follows:", 50, {})
  yPosition -= lineHeight + 15

  // Paragraph 1 - Residency
  const residencyMonths = data["residency-duration-months"] || "___"
  addText("1.", 50, { font: boldFont })
  addText(`RESIDENCY: Petitioner has been a resident of the State of Illinois for at`, 70, {})
  yPosition -= lineHeight
  addText(`least 90 days prior to the filing of this petition. Petitioner has resided in`, 70, {})
  yPosition -= lineHeight
  addText(`${countyName} County for approximately ${residencyMonths} months.`, 70, {})
  yPosition -= lineHeight + 10

  checkNewPage()

  // Paragraph 2 - Marriage Information
  const marriageDate = formatDate(data["marriage-date"])
  addText("2.", 50, { font: boldFont })
  addText(`MARRIAGE: The parties were married on ${marriageDate}.`, 70, {})
  yPosition -= lineHeight + 10

  // Paragraph 3 - Separation
  const separationDate = formatDate(data["separation-date"])
  addText("3.", 50, { font: boldFont })
  addText(`SEPARATION: The parties separated on or about ${separationDate}.`, 70, {})
  yPosition -= lineHeight + 10

  checkNewPage()

  // Paragraph 4 - Grounds
  addText("4.", 50, { font: boldFont })
  addText("GROUNDS FOR DISSOLUTION:", 70, { font: boldFont })
  yPosition -= lineHeight

  if (data["grounds-type"] === "irreconcilable") {
    const duration = data["irreconcilable-duration"] || "___"
    addText(`Irreconcilable differences have caused the irretrievable breakdown of the`, 70, {})
    yPosition -= lineHeight
    addText(`marriage. The parties have lived separate and apart for a continuous period`, 70, {})
    yPosition -= lineHeight
    addText(`of approximately ${duration} months. Efforts at reconciliation have failed or`, 70, {})
    yPosition -= lineHeight
    addText(`future attempts at reconciliation would be impracticable and not in the best`, 70, {})
    yPosition -= lineHeight
    addText(`interests of the family.`, 70, {})
  } else {
    addText(`[Grounds: ${data["grounds-type"] || "Not specified"}]`, 70, {})
  }
  yPosition -= lineHeight + 10

  checkNewPage()

  // Paragraph 5 - Children
  addText("5.", 50, { font: boldFont })
  addText("CHILDREN:", 70, { font: boldFont })
  yPosition -= lineHeight

  if (data["has-children"] === "yes") {
    addText("There are minor children born or adopted of this marriage.", 70, {})
    yPosition -= lineHeight
    addText("[Child information to be provided in separate filing]", 70, { font: italicFont })
  } else {
    addText("There are no minor children born or adopted of this marriage.", 70, {})
  }
  yPosition -= lineHeight + 10

  checkNewPage()

  // Paragraph 6 - Property
  addText("6.", 50, { font: boldFont })
  addText("PROPERTY: The parties have acquired property during the marriage which", 70, {})
  yPosition -= lineHeight
  addText("should be divided equitably between the parties.", 70, {})
  yPosition -= lineHeight + 10

  // Paragraph 7 - No Other Actions
  addText("7.", 50, { font: boldFont })
  addText("OTHER PROCEEDINGS: To the best of Petitioner's knowledge, no other", 70, {})
  yPosition -= lineHeight
  addText("action for dissolution, legal separation, or declaration of invalidity of", 70, {})
  yPosition -= lineHeight
  addText("marriage is pending in any court.", 70, {})
  yPosition -= lineHeight + 15

  checkNewPage()

  // === PRAYER FOR RELIEF ===
  addText("WHEREFORE, Petitioner prays that this Court:", 50, { font: boldFont })
  yPosition -= lineHeight + 5

  addText("A.", 70, { font: boldFont })
  addText("Enter a Judgment dissolving the marriage between the parties;", 90, {})
  yPosition -= lineHeight

  addText("B.", 70, { font: boldFont })
  addText("Divide the marital property equitably between the parties;", 90, {})
  yPosition -= lineHeight

  addText("C.", 70, { font: boldFont })
  addText("Award such other and further relief as the Court deems just and proper.", 90, {})
  yPosition -= lineHeight + 20

  checkNewPage()

  // === SIGNATURE BLOCK ===
  addText("Respectfully submitted,", 50, {})
  yPosition -= lineHeight + 30

  page.drawLine({
    start: { x: 50, y: yPosition + 5 },
    end: { x: 250, y: yPosition + 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText(petitionerName, 50, {})
  yPosition -= lineHeight
  addText("Petitioner, Pro Se", 50, { font: italicFont })
  yPosition -= lineHeight + 5

  addText(data["petitioner-address"] || "___________________________", 50, {})
  yPosition -= lineHeight
  addText(`${countyName} County, Illinois`, 50, {})
  yPosition -= lineHeight + 20

  // === VERIFICATION ===
  checkNewPage()
  addLine()
  yPosition -= 5

  addText("VERIFICATION", 0, { font: boldFont, size: 12, centered: true })
  yPosition -= lineHeight + 10

  addText("Under penalties as provided by law pursuant to Section 1-109 of the Code", 50, {})
  yPosition -= lineHeight
  addText("of Civil Procedure, the undersigned certifies that the statements set forth", 50, {})
  yPosition -= lineHeight
  addText("in this instrument are true and correct, except as to matters therein stated", 50, {})
  yPosition -= lineHeight
  addText("to be on information and belief and as to such matters the undersigned", 50, {})
  yPosition -= lineHeight
  addText("certifies as aforesaid that the undersigned verily believes the same to be true.", 50, {})
  yPosition -= lineHeight + 20

  page.drawLine({
    start: { x: 50, y: yPosition + 5 },
    end: { x: 250, y: yPosition + 5 },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText("Petitioner Signature", 50, { font: italicFont, size: 9 })
  yPosition -= lineHeight + 5

  addText("Date: _______________", 50, {})
  yPosition -= lineHeight + 20

  // === FOOTER / DISCLAIMER ===
  checkNewPage()
  yPosition = 60

  page.drawLine({
    start: { x: 50, y: yPosition + 15 },
    end: { x: 562, y: yPosition + 15 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })

  addText(
    "DISCLAIMER: This document was generated by FreshStart IL for informational purposes only.",
    50,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= 10
  addText(
    "This is not legal advice. Please consult with an attorney before filing with the court.",
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

function formatCounty(county: string): string {
  const countyMap: Record<string, string> = {
    cook: "Cook",
    dupage: "DuPage",
    lake: "Lake",
    will: "Will",
    kane: "Kane",
    mchenry: "McHenry",
    winnebago: "Winnebago",
    madison: "Madison",
    "st-clair": "St. Clair",
    champaign: "Champaign",
  }
  return countyMap[county] || county.charAt(0).toUpperCase() + county.slice(1)
}

function formatDate(dateStr?: string): string {
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
