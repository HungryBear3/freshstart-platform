/**
 * Admin API endpoint to seed sample questionnaires
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { seedQuestionnaires } from "@/lib/seed-questionnaires";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log("[Seed Questionnaires] Received request");
    const user = await getCurrentUser(request);
    console.log("[Seed Questionnaires] User:", user ? { id: user.id, email: user.email } : "null");
    
    if (!user) {
      console.error("[Seed Questionnaires] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check
    // For now, any authenticated user can seed questionnaires

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
