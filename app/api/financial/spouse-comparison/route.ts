import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { transformFinancialResponses } from "@/lib/document-generation/transform-financial";
import {
  calculateTotals,
  detectDiscrepancies,
  type SpouseFinancialData,
} from "@/lib/financial/comparison";
import type { FinancialData } from "@/lib/financial/types";

/**
 * GET - Fetch comparison data: user's financial summary + spouse's record (if any)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User's financial data from questionnaire
    const questionnaireResponse = await prisma.questionnaireResponse.findFirst({
      where: { userId: user.id, formType: "financial_affidavit" },
      orderBy: { updatedAt: "desc" },
    });

    let userData: FinancialData | null = null;
    if (questionnaireResponse) {
      const responses = questionnaireResponse.responses as Record<string, unknown>;
      userData = transformFinancialResponses(responses, user.id);
    }

    // Spouse's financial record
    const spouseRecord = await prisma.spouseFinancialRecord.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    const spouseData: SpouseFinancialData | null = spouseRecord
      ? (spouseRecord.data as unknown as SpouseFinancialData)
      : null;

    const userTotals = userData ? calculateTotals(userData) : null;
    const spouseTotals = spouseData ? calculateTotals(spouseData) : null;
    const discrepancies =
      userData && spouseData ? detectDiscrepancies(userData, spouseData) : [];

    return NextResponse.json({
      userData,
      userTotals,
      spouseData,
      spouseTotals,
      spouseRecordId: spouseRecord?.id ?? null,
      authorizationConfirmed: !!spouseRecord?.authorizationConfirmedAt,
      discrepancies,
      hasUserData: !!userData,
      hasSpouseData: !!spouseData,
    });
  } catch (error) {
    console.error("[Spouse Comparison GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create or update spouse financial record (requires authorization)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { data, authorizationConfirmed, sourceDocumentId } = body;

    if (!authorizationConfirmed) {
      return NextResponse.json(
        { error: "You must confirm authorization to upload/enter spouse financial data" },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Invalid data: must include income, expenses, assets, debts" },
        { status: 400 }
      );
    }

    // Normalize to match our types (ensure frequency, isCurrent, ownership where needed)
    const normalizeIncome = (arr: unknown[]) =>
      arr.map((item: any) => ({
        type: item.type || "other",
        source: String(item.source || ""),
        amount: Number(item.amount) || 0,
        frequency: item.frequency || "monthly",
        isCurrent: item.isCurrent !== false,
      }));
    const normalizeExpense = (arr: unknown[]) =>
      arr.map((item: any) => ({
        category: item.category || "other",
        description: String(item.description || ""),
        amount: Number(item.amount) || 0,
        frequency: item.frequency || "monthly",
      }));
    const normalizeAsset = (arr: unknown[]) =>
      arr.map((item: any) => ({
        type: item.type || "other",
        description: String(item.description || ""),
        value: Number(item.value) || 0,
        ownership: item.ownership || "joint",
      }));
    const normalizeDebt = (arr: unknown[]) =>
      arr.map((item: any) => ({
        type: item.type || "other",
        creditor: String(item.creditor || ""),
        balance: Number(item.balance) || 0,
        ownership: item.ownership || "joint",
      }));

    const spouseData: SpouseFinancialData = {
      income: normalizeIncome(Array.isArray(data.income) ? data.income : []),
      expenses: normalizeExpense(Array.isArray(data.expenses) ? data.expenses : []),
      assets: normalizeAsset(Array.isArray(data.assets) ? data.assets : []),
      debts: normalizeDebt(Array.isArray(data.debts) ? data.debts : []),
    };

    const existing = await prisma.spouseFinancialRecord.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await prisma.spouseFinancialRecord.update({
        where: { id: existing.id },
        data: {
          data: spouseData as unknown as Prisma.InputJsonValue,
          sourceDocumentId: sourceDocumentId || existing.sourceDocumentId,
          authorizationConfirmedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, updated: true });
    }

    await prisma.spouseFinancialRecord.create({
      data: {
        userId: user.id,
        data: spouseData as unknown as Prisma.InputJsonValue,
        sourceDocumentId: sourceDocumentId || null,
        authorizationConfirmedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, created: true });
  } catch (error) {
    console.error("[Spouse Comparison POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to save spouse financial data" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove spouse financial record
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.spouseFinancialRecord.deleteMany({
      where: { userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Spouse Comparison DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete spouse data" },
      { status: 500 }
    );
  }
}
