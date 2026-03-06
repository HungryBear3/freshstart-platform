import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib"
import type { FinancialData } from "@/lib/financial/types"

interface UserInfo {
  name?: string | null
  email: string
}

/**
 * Generate a Financial Affidavit PDF based on Illinois court forms
 * Supports both short and long form versions
 */
export async function generateFinancialAffidavitPDF(
  financialData: FinancialData,
  userInfo: UserInfo
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // US Letter size (8.5 x 11 inches)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 10
  const lineHeight = 14
  let currentPage = page
  let yPosition = 750 // Start near top of page

  // Helper function to add text
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

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Helper function to format date
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return ""
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Title
  addText(
    `FINANCIAL AFFIDAVIT - ${financialData.formType.toUpperCase()} FORM`,
    50,
    yPosition,
    { font: boldFont, size: 14 }
  )
  yPosition -= 30

  // User Information Section
  addText("PETITIONER INFORMATION", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  addText(`Name: ${userInfo.name || "N/A"}`, 50, yPosition)
  yPosition -= lineHeight
  addText(`Email: ${userInfo.email}`, 50, yPosition)
  yPosition -= lineHeight
  addText(`Date: ${new Date().toLocaleDateString("en-US")}`, 50, yPosition)
  yPosition -= 30

  // Income Section
  addText("INCOME", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (financialData.income.length === 0) {
    addText("No income sources reported.", 50, yPosition)
    yPosition -= lineHeight
  } else {
    // Calculate monthly totals
    const monthlyIncome = financialData.income.reduce((total, income) => {
      let monthlyAmount = income.amount
      switch (income.frequency) {
        case "weekly":
          monthlyAmount = income.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = income.amount * 2.17
          break
        case "yearly":
          monthlyAmount = income.amount / 12
          break
        case "one_time":
          monthlyAmount = 0
          break
      }
      return total + monthlyAmount
    }, 0)

    addText("Income Sources:", 50, yPosition)
    yPosition -= lineHeight

    financialData.income.forEach((income) => {
      if (yPosition < 50) {
        // New page if needed
        currentPage = pdfDoc.addPage([612, 792])
        yPosition = 750
      }

      let monthlyAmount = income.amount
      switch (income.frequency) {
        case "weekly":
          monthlyAmount = income.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = income.amount * 2.17
          break
        case "yearly":
          monthlyAmount = income.amount / 12
          break
        case "one_time":
          monthlyAmount = 0
          break
      }

      addText(
        `• ${income.source} (${income.type}): ${formatCurrency(monthlyAmount)}/month`,
        70,
        yPosition
      )
      yPosition -= lineHeight

      if (income.startDate || income.endDate) {
        addText(
          `  Period: ${formatDate(income.startDate)} - ${formatDate(income.endDate)}`,
          70,
          yPosition
        )
        yPosition -= lineHeight
      }

      if (income.notes) {
        addText(`  Notes: ${income.notes}`, 70, yPosition)
        yPosition -= lineHeight
      }
    })

    addText(
      `Total Monthly Income: ${formatCurrency(monthlyIncome)}`,
      50,
      yPosition,
      { font: boldFont }
    )
    yPosition -= 30
  }

  // Expenses Section
  addText("MONTHLY EXPENSES", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (financialData.expenses.length === 0) {
    addText("No expenses reported.", 50, yPosition)
    yPosition -= lineHeight
  } else {
    const monthlyExpenses = financialData.expenses.reduce((total, expense) => {
      let monthlyAmount = expense.amount
      switch (expense.frequency) {
        case "weekly":
          monthlyAmount = expense.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = expense.amount * 2.17
          break
        case "yearly":
          monthlyAmount = expense.amount / 12
          break
        case "one_time":
          monthlyAmount = 0
          break
      }
      return total + monthlyAmount
    }, 0)

    financialData.expenses.forEach((expense) => {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([612, 792])
        yPosition = 750
      }

      let monthlyAmount = expense.amount
      switch (expense.frequency) {
        case "weekly":
          monthlyAmount = expense.amount * 4.33
          break
        case "biweekly":
          monthlyAmount = expense.amount * 2.17
          break
        case "yearly":
          monthlyAmount = expense.amount / 12
          break
        case "one_time":
          monthlyAmount = 0
          break
      }

      addText(
        `• ${expense.description} (${expense.category}): ${formatCurrency(monthlyAmount)}/month`,
        70,
        yPosition
      )
      yPosition -= lineHeight

      if (expense.notes) {
        addText(`  Notes: ${expense.notes}`, 70, yPosition)
        yPosition -= lineHeight
      }
    })

    addText(
      `Total Monthly Expenses: ${formatCurrency(monthlyExpenses)}`,
      50,
      yPosition,
      { font: boldFont }
    )
    yPosition -= 30
  }

  // Assets Section
  addText("ASSETS", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (financialData.assets.length === 0) {
    addText("No assets reported.", 50, yPosition)
    yPosition -= lineHeight
  } else {
    const totalAssets = financialData.assets.reduce(
      (total, asset) => total + asset.value,
      0
    )

    financialData.assets.forEach((asset) => {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([612, 792])
        yPosition = 750
      }

      addText(
        `• ${asset.description} (${asset.type}): ${formatCurrency(asset.value)} - ${asset.ownership}`,
        70,
        yPosition
      )
      yPosition -= lineHeight

      if (asset.notes) {
        addText(`  Notes: ${asset.notes}`, 70, yPosition)
        yPosition -= lineHeight
      }
    })

    addText(
      `Total Assets: ${formatCurrency(totalAssets)}`,
      50,
      yPosition,
      { font: boldFont }
    )
    yPosition -= 30
  }

  // Debts Section
  addText("DEBTS AND LIABILITIES", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  if (financialData.debts.length === 0) {
    addText("No debts reported.", 50, yPosition)
    yPosition -= lineHeight
  } else {
    const totalDebts = financialData.debts.reduce(
      (total, debt) => total + debt.balance,
      0
    )

    financialData.debts.forEach((debt) => {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage([612, 792])
        yPosition = 750
      }

      addText(
        `• ${debt.creditor} (${debt.type}): ${formatCurrency(debt.balance)}`,
        70,
        yPosition
      )
      yPosition -= lineHeight

      if (debt.monthlyPayment) {
        addText(
          `  Monthly Payment: ${formatCurrency(debt.monthlyPayment)}`,
          70,
          yPosition
        )
        yPosition -= lineHeight
      }

      if (debt.description) {
        addText(`  Description: ${debt.description}`, 70, yPosition)
        yPosition -= lineHeight
      }

      if (debt.notes) {
        addText(`  Notes: ${debt.notes}`, 70, yPosition)
        yPosition -= lineHeight
      }
    })

    addText(
      `Total Debts: ${formatCurrency(totalDebts)}`,
      50,
      yPosition,
      { font: boldFont }
    )
    yPosition -= 30
  }

  // Summary Section
  if (yPosition < 100) {
    currentPage = pdfDoc.addPage([612, 792])
    yPosition = 750
  }

  addText("SUMMARY", 50, yPosition, { font: boldFont, size: 12 })
  yPosition -= 20

  const monthlyIncome = financialData.income.reduce((total, income) => {
    let monthlyAmount = income.amount
    switch (income.frequency) {
      case "weekly":
        monthlyAmount = income.amount * 4.33
        break
      case "biweekly":
        monthlyAmount = income.amount * 2.17
        break
      case "yearly":
        monthlyAmount = income.amount / 12
        break
      case "one_time":
        monthlyAmount = 0
        break
    }
    return total + monthlyAmount
  }, 0)

  const monthlyExpenses = financialData.expenses.reduce((total, expense) => {
    let monthlyAmount = expense.amount
    switch (expense.frequency) {
      case "weekly":
        monthlyAmount = expense.amount * 4.33
        break
      case "biweekly":
        monthlyAmount = expense.amount * 2.17
        break
      case "yearly":
        monthlyAmount = expense.amount / 12
        break
      case "one_time":
        monthlyAmount = 0
        break
    }
    return total + monthlyAmount
  }, 0)

  const totalAssets = financialData.assets.reduce(
    (total, asset) => total + asset.value,
    0
  )

  const totalDebts = financialData.debts.reduce(
    (total, debt) => total + debt.balance,
    0
  )

  addText(`Net Monthly Income: ${formatCurrency(monthlyIncome - monthlyExpenses)}`, 50, yPosition)
  yPosition -= lineHeight
  addText(`Net Worth: ${formatCurrency(totalAssets - totalDebts)}`, 50, yPosition)
  yPosition -= 30

  // Disclaimer
  addText(
    "DISCLAIMER: This document is generated for informational purposes only.",
    50,
    yPosition,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )
  yPosition -= lineHeight
  addText(
    "Consult with an attorney before filing with the court.",
    50,
    yPosition,
    { size: 8, color: rgb(0.5, 0.5, 0.5) }
  )

  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}
