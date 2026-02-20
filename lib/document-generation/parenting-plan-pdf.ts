import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib"

interface ParentingPlanData {
  // Support both kebab-case (from questionnaire) and camelCase
  [key: string]: any
}

interface UserInfo {
  name?: string | null
  email: string
}

// Helper to get value from either kebab-case or camelCase keys
function getValue(data: ParentingPlanData, kebab: string, camel: string): any {
  return data[kebab] ?? data[camel]
}

/**
 * Generate a Parenting Plan PDF document
 */
export async function generateParentingPlanPDF(
  planData: ParentingPlanData,
  userInfo: UserInfo
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 10
  const lineHeight = 14
  let currentPage = page
  let yPosition = 750

  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      font?: PDFFont
      size?: number
      color?: ReturnType<typeof rgb>
    } = {}
  ) => {
    currentPage.drawText(text, {
      x,
      y,
      size: options.size || fontSize,
      font: options.font || font,
      color: options.color || rgb(0, 0, 0),
    })
  }

  // Get values (support both kebab-case from questionnaire and camelCase)
  const childrenCount = getValue(planData, "children-count", "childrenCount")
  const child1Name = getValue(planData, "child-1-name", "child1Name")
  const child1Dob = getValue(planData, "child-1-dob", "child1Dob")
  const child1School = getValue(planData, "child-1-school", "child1School")
  const child1SpecialNeeds = getValue(planData, "child-1-special-needs", "child1SpecialNeeds")
  const child2Name = getValue(planData, "child-2-name", "child2Name")
  const child2Dob = getValue(planData, "child-2-dob", "child2Dob")
  const child3Name = getValue(planData, "child-3-name", "child3Name")
  const child3Dob = getValue(planData, "child-3-dob", "child3Dob")
  
  const educationAuthority = getValue(planData, "education-authority", "educationAuthority")
  const healthcareAuthority = getValue(planData, "healthcare-authority", "healthcareAuthority")
  const religiousAuthority = getValue(planData, "religious-authority", "religiousAuthority")
  const extracurricularAuthority = getValue(planData, "extracurricular-authority", "extracurricularAuthority")
  
  const scheduleType = getValue(planData, "schedule-type", "scheduleType")
  const primaryResidence = getValue(planData, "primary-residence", "primaryResidence")
  const weekdayParent = getValue(planData, "weekday-parent", "weekdayParent")
  const weekendExchangeDay = getValue(planData, "weekend-exchange-day", "weekendExchangeDay")
  const weekendReturnDay = getValue(planData, "weekend-return-day", "weekendReturnDay")
  const midweekVisit = getValue(planData, "midweek-visit", "midweekVisit")
  const midweekVisitDay = getValue(planData, "midweek-visit-day", "midweekVisitDay")
  
  const holidayApproach = getValue(planData, "holiday-approach", "holidayApproach")
  const thanksgivingOddYears = getValue(planData, "thanksgiving-odd-years", "thanksgivingOddYears")
  const christmasEveOddYears = getValue(planData, "christmas-eve-odd-years", "christmasEveOddYears")
  const christmasDayOddYears = getValue(planData, "christmas-day-odd-years", "christmasDayOddYears")
  const mothersDay = getValue(planData, "mothers-day", "mothersDay")
  const fathersDay = getValue(planData, "fathers-day", "fathersDay")
  const childBirthday = getValue(planData, "child-birthday", "childBirthday")
  const springBreak = getValue(planData, "spring-break", "springBreak")
  
  const summerApproach = getValue(planData, "summer-approach", "summerApproach")
  const summerVacationWeeks = getValue(planData, "summer-vacation-weeks", "summerVacationWeeks")
  const vacationNoticeDays = getValue(planData, "vacation-notice-days", "vacationNoticeDays")
  
  const communicationMethod = getValue(planData, "communication-method", "communicationMethod")
  const responseTime = getValue(planData, "response-time", "responseTime")
  const childPhoneContact = getValue(planData, "child-phone-contact", "childPhoneContact")
  const phoneContactFrequency = getValue(planData, "phone-contact-frequency", "phoneContactFrequency")
  
  const exchangeLocation = getValue(planData, "exchange-location", "exchangeLocation")
  const transportationResponsibility = getValue(planData, "transportation-responsibility", "transportationResponsibility")
  const exchangeTimeFlexibility = getValue(planData, "exchange-time-flexibility", "exchangeTimeFlexibility")
  
  const rightOfFirstRefusal = getValue(planData, "right-of-first-refusal", "rightOfFirstRefusal")
  const refusalHours = getValue(planData, "refusal-hours", "refusalHours")
  const relocationNotice = getValue(planData, "relocation-notice", "relocationNotice")
  const introducePartners = getValue(planData, "introduce-partners", "introducePartners")
  const additionalNotes = getValue(planData, "additional-notes", "additionalNotes")

  const generatedAt = new Date()

  // Title
  addText("PARENTING PLAN", 50, yPosition, { font: boldFont, size: 16 })
  yPosition -= 20
  addText("State of Illinois", 50, yPosition, { font: font, size: 10 })
  yPosition -= 30

  // User Information
  addText("PETITIONER INFORMATION", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20
  addText(`Name: ${userInfo.name || "N/A"}`, 50, yPosition)
  yPosition -= lineHeight
  addText(`Email: ${userInfo.email}`, 50, yPosition)
  yPosition -= lineHeight
  addText(`Generated: ${generatedAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`, 50, yPosition)
  yPosition -= 30

  // Children Information
  if (child1Name) {
    addText("CHILDREN", 50, yPosition, { font: boldFont, size: 12 })
    yPosition -= 20
    
    addText(`Number of Children: ${childrenCount || 1}`, 50, yPosition)
    yPosition -= lineHeight + 5
    
    addText(`Child 1: ${child1Name}`, 50, yPosition)
    yPosition -= lineHeight
    if (child1Dob) {
      addText(`   Date of Birth: ${child1Dob}`, 50, yPosition)
      yPosition -= lineHeight
    }
    if (child1School) {
      addText(`   School: ${child1School}`, 50, yPosition)
      yPosition -= lineHeight
    }
    if (child1SpecialNeeds) {
      addText(`   Special Needs: ${child1SpecialNeeds}`, 50, yPosition)
      yPosition -= lineHeight
    }
    
    if (child2Name) {
      yPosition -= 5
      addText(`Child 2: ${child2Name}`, 50, yPosition)
      yPosition -= lineHeight
      if (child2Dob) {
        addText(`   Date of Birth: ${child2Dob}`, 50, yPosition)
        yPosition -= lineHeight
      }
    }
    
    if (child3Name) {
      yPosition -= 5
      addText(`Child 3: ${child3Name}`, 50, yPosition)
      yPosition -= lineHeight
      if (child3Dob) {
        addText(`   Date of Birth: ${child3Dob}`, 50, yPosition)
        yPosition -= lineHeight
      }
    }
    
    yPosition -= 20
  }

  // Decision-Making Authority
  addText("DECISION-MAKING AUTHORITY", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (educationAuthority) {
    addText(
      `Education Decisions: ${formatAuthority(educationAuthority)}`,
      50,
      yPosition
    )
    yPosition -= lineHeight
  }

  if (healthcareAuthority) {
    addText(
      `Healthcare Decisions: ${formatAuthority(healthcareAuthority)}`,
      50,
      yPosition
    )
    yPosition -= lineHeight
  }

  if (religiousAuthority) {
    addText(
      `Religious Decisions: ${formatAuthority(religiousAuthority)}`,
      50,
      yPosition
    )
    yPosition -= lineHeight
  }

  if (extracurricularAuthority) {
    addText(
      `Extracurricular Activities: ${formatAuthority(extracurricularAuthority)}`,
      50,
      yPosition
    )
    yPosition -= lineHeight
  }

  yPosition -= 20

  // Regular Parenting Schedule
  if (yPosition < 200) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("REGULAR PARENTING SCHEDULE", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (scheduleType) {
    addText(`Schedule Type: ${formatScheduleType(scheduleType)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (primaryResidence) {
    addText(`Primary Residential Parent: ${formatParent(primaryResidence)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (weekdayParent) {
    addText(`School Nights (Mon-Thu): ${formatParent(weekdayParent)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (weekendExchangeDay) {
    addText(`Weekends Start: ${formatExchangeTime(weekendExchangeDay)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (weekendReturnDay) {
    addText(`Weekends End: ${formatExchangeTime(weekendReturnDay)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (midweekVisit === "yes" && midweekVisitDay) {
    addText(`Midweek Visit: ${midweekVisitDay.charAt(0).toUpperCase() + midweekVisitDay.slice(1)}`, 50, yPosition)
    yPosition -= lineHeight
  }

  yPosition -= 20

  // Holiday Schedule
  if (yPosition < 200) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("HOLIDAY SCHEDULE", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (holidayApproach) {
    addText(`General Approach: ${formatHolidayApproach(holidayApproach)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (thanksgivingOddYears) {
    addText(`Thanksgiving (Odd Years): ${formatParent(thanksgivingOddYears)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (christmasEveOddYears) {
    addText(`Christmas Eve (Odd Years): ${formatParent(christmasEveOddYears)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (christmasDayOddYears) {
    addText(`Christmas Day (Odd Years): ${formatParent(christmasDayOddYears)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (mothersDay) {
    addText(`Mother's Day: ${mothersDay === "mother" ? "Always with Mother" : "Follow Regular Schedule"}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (fathersDay) {
    addText(`Father's Day: ${fathersDay === "father" ? "Always with Father" : "Follow Regular Schedule"}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (childBirthday) {
    addText(`Children's Birthdays: ${formatBirthdayApproach(childBirthday)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (springBreak) {
    addText(`Spring Break: ${formatBreakApproach(springBreak)}`, 50, yPosition)
    yPosition -= lineHeight
  }

  yPosition -= 20

  // Summer Schedule
  if (yPosition < 150) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("SUMMER VACATION SCHEDULE", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (summerApproach) {
    addText(`Approach: ${formatSummerApproach(summerApproach)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (summerVacationWeeks) {
    addText(`Vacation Weeks Per Parent: ${summerVacationWeeks}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (vacationNoticeDays) {
    addText(`Vacation Notice Required: ${vacationNoticeDays} days`, 50, yPosition)
    yPosition -= lineHeight
  }

  yPosition -= 20

  // Communication
  if (yPosition < 150) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("COMMUNICATION PROTOCOLS", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (communicationMethod) {
    addText(`Primary Method: ${formatCommunicationMethod(communicationMethod)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (responseTime) {
    addText(`Expected Response Time: ${formatResponseTime(responseTime)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (childPhoneContact) {
    addText(`Child Phone/Video Contact: ${childPhoneContact === "yes" ? "Yes" : "No"}`, 50, yPosition)
    yPosition -= lineHeight
    if (childPhoneContact === "yes" && phoneContactFrequency) {
      addText(`   Frequency: ${formatContactFrequency(phoneContactFrequency)}`, 50, yPosition)
      yPosition -= lineHeight
    }
  }

  yPosition -= 20

  // Transportation
  if (yPosition < 150) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("TRANSPORTATION & EXCHANGES", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (exchangeLocation) {
    addText(`Exchange Location: ${formatExchangeLocation(exchangeLocation)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (transportationResponsibility) {
    addText(`Transportation: ${formatTransportation(transportationResponsibility)}`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (exchangeTimeFlexibility) {
    addText(`Grace Period: ${exchangeTimeFlexibility} minutes`, 50, yPosition)
    yPosition -= lineHeight
  }

  yPosition -= 20

  // Additional Provisions
  if (yPosition < 150) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  addText("ADDITIONAL PROVISIONS", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (rightOfFirstRefusal) {
    addText(`Right of First Refusal: ${rightOfFirstRefusal === "yes" ? "Yes" : "No"}`, 50, yPosition)
    yPosition -= lineHeight
    if (rightOfFirstRefusal === "yes" && refusalHours) {
      addText(`   Applies after: ${refusalHours} hours`, 50, yPosition)
      yPosition -= lineHeight
    }
  }
  if (relocationNotice) {
    addText(`Relocation Notice Required: ${relocationNotice} days`, 50, yPosition)
    yPosition -= lineHeight
  }
  if (introducePartners) {
    addText(`New Partner Introduction: ${formatPartnerIntro(introducePartners)}`, 50, yPosition)
    yPosition -= lineHeight
  }

  if (additionalNotes) {
    yPosition -= 10
    addText("Additional Notes:", 50, yPosition)
    yPosition -= lineHeight
    const notesLines = wrapText(additionalNotes, 80)
    notesLines.forEach((line) => {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([612, 792])
        yPosition = 750
      }
      addText(line, 70, yPosition)
      yPosition -= lineHeight
    })
  }

  // Signature lines
  if (yPosition < 150) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }
  
  yPosition -= 30
  addText("SIGNATURES", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 30

  currentPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 250, y: yPosition },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText("Parent 1 (Petitioner)", 50, yPosition)
  addText("Date: _______________", 300, yPosition)
  yPosition -= 30

  currentPage.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 250, y: yPosition },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  })
  yPosition -= lineHeight
  addText("Parent 2 (Respondent)", 50, yPosition)
  addText("Date: _______________", 300, yPosition)

  // Disclaimer
  if (yPosition < 100) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }

  yPosition -= 40
  currentPage.drawLine({
    start: { x: 50, y: yPosition + 10 },
    end: { x: 562, y: yPosition + 10 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  })

  addText(
    "DISCLAIMER: This document is generated for informational purposes only.",
    50,
    yPosition,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= lineHeight
  addText(
    "This is not legal advice. Consult with an attorney before filing with the court.",
    50,
    yPosition,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= lineHeight
  addText(
    `Generated: ${generatedAt.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`,
    50,
    yPosition,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

function formatAuthority(authority: string): string {
  switch (authority) {
    case "parent1":
      return "Parent 1"
    case "parent2":
      return "Parent 2"
    case "joint":
      return "Joint"
    default:
      return authority
  }
}

function formatParent(parent: string): string {
  switch (parent) {
    case "parent1":
      return "Parent 1"
    case "parent2":
      return "Parent 2"
    case "both":
      return "Both Parents"
    case "alternating":
      return "Alternating"
    default:
      return parent || "Not specified"
  }
}

function formatCommunicationMethod(method: string): string {
  switch (method) {
    case "email":
      return "Email"
    case "text":
      return "Text Message"
    case "phone":
      return "Phone Call"
    case "app":
      return "Co-parenting App (OurFamilyWizard, TalkingParents)"
    case "in_person":
      return "In Person"
    default:
      return method
  }
}

function formatScheduleType(type: string): string {
  switch (type) {
    case "standard":
      return "Standard - Every other weekend with one parent"
    case "week_on_off":
      return "50/50 - Week on/week off"
    case "2_2_3":
      return "50/50 - 2-2-3 rotation"
    case "3_4_4_3":
      return "50/50 - 3-4-4-3 rotation"
    case "60_40":
      return "60/40 split"
    case "custom":
      return "Custom schedule"
    default:
      return type
  }
}

function formatExchangeTime(time: string): string {
  switch (time) {
    case "friday_school":
      return "Friday after school"
    case "friday_6pm":
      return "Friday at 6:00 PM"
    case "saturday_morning":
      return "Saturday morning"
    case "sunday_6pm":
      return "Sunday at 6:00 PM"
    case "monday_school":
      return "Monday morning (drop at school)"
    default:
      return time
  }
}

function formatHolidayApproach(approach: string): string {
  switch (approach) {
    case "alternate":
      return "Alternate years (odd/even)"
    case "split":
      return "Split each holiday"
    case "specific":
      return "Specific holidays to each parent"
    default:
      return approach
  }
}

function formatBirthdayApproach(approach: string): string {
  switch (approach) {
    case "alternate":
      return "Alternate years"
    case "split":
      return "Split the day"
    case "together":
      return "Celebrate with both parents together"
    case "separate":
      return "Each parent celebrates separately"
    default:
      return approach
  }
}

function formatBreakApproach(approach: string): string {
  switch (approach) {
    case "alternate":
      return "Alternate years"
    case "split":
      return "Split (first half/second half)"
    case "regular":
      return "Follow regular schedule"
    default:
      return approach
  }
}

function formatSummerApproach(approach: string): string {
  switch (approach) {
    case "regular":
      return "Continue regular schedule"
    case "extended":
      return "Extended time with non-custodial parent"
    case "fifty_fifty":
      return "50/50 split (2 weeks each alternating)"
    case "custom":
      return "Custom arrangement"
    default:
      return approach
  }
}

function formatResponseTime(time: string): string {
  switch (time) {
    case "24_hours":
      return "Within 24 hours"
    case "48_hours":
      return "Within 48 hours"
    case "72_hours":
      return "Within 72 hours"
    default:
      return time
  }
}

function formatContactFrequency(freq: string): string {
  switch (freq) {
    case "daily":
      return "Daily"
    case "every_other_day":
      return "Every other day"
    case "twice_weekly":
      return "Twice per week"
    case "reasonable":
      return "As reasonable"
    default:
      return freq
  }
}

function formatExchangeLocation(location: string): string {
  switch (location) {
    case "parent1_home":
      return "Parent 1's residence"
    case "parent2_home":
      return "Parent 2's residence"
    case "school":
      return "School (drop off/pick up)"
    case "public":
      return "Public location (police station, restaurant)"
    case "midpoint":
      return "Midpoint between homes"
    default:
      return location
  }
}

function formatTransportation(resp: string): string {
  switch (resp) {
    case "receiving":
      return "Receiving parent picks up"
    case "sending":
      return "Sending parent drops off"
    case "split":
      return "Split - each drives one way"
    default:
      return resp
  }
}

function formatPartnerIntro(intro: string): string {
  switch (intro) {
    case "none":
      return "No restrictions"
    case "3_months":
      return "After 3 months of dating"
    case "6_months":
      return "After 6 months of dating"
    case "committed":
      return "Not until engaged/committed"
    default:
      return intro
  }
}

function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  words.forEach((word) => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? " " : "") + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
