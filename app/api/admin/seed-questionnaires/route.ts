/**
 * Admin API endpoint to seed sample questionnaires
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { seedQuestionnaires } from "@/lib/seed-questionnaires";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    console.log("[Seed Questionnaires] Starting seed process...");
    await seedQuestionnaires();

    return NextResponse.json({
      success: true,
      message: "Questionnaires seeded successfully",
    });
  } catch (error) {
    console.error("Error seeding questionnaires:", error);
    return NextResponse.json(
      {
        error: "Failed to seed questionnaires",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
