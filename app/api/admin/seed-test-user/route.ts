/**
 * Admin API endpoint to create a test user
 */

import { NextRequest, NextResponse } from "next/server";
import { seedTestUser } from "@/lib/seed-test-user";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // No auth required for test user creation (development only)
    const user = await seedTestUser();

    return NextResponse.json({
      success: true,
      message: user.email === "test@example.com" 
        ? "Test user already exists or was created successfully"
        : "Test user created successfully",
      user: {
        email: user.email,
        name: user.name,
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
