/**
 * Admin API endpoint to create a test user
 */

import { NextRequest, NextResponse } from "next/server";
import { seedTestUser } from "@/lib/seed-test-user";
import { requireAdmin } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    // Disable in production for safety
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Test user creation is disabled in production" },
        { status: 403 }
      );
    }

    const createdUser = await seedTestUser();

    return NextResponse.json({
      success: true,
      message: createdUser.email === "test@example.com"
        ? "Test user already exists or was created successfully"
        : "Test user created successfully",
      user: {
        email: createdUser.email,
        name: createdUser.name,
      },
      credentials: {
        email: "test@example.com",
        password: "test123456",
      },
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: "Failed to create test user",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
