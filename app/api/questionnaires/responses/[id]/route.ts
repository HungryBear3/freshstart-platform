/**
 * API route for managing a specific questionnaire response
 * GET: Get a specific response
 * PUT: Update a response
 * DELETE: Delete a response
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { sanitizeString } from "@/lib/security/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const response = await prisma.questionnaireResponse.findUnique({
      where: { id },
      include: {
        questionnaire: true,
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (response.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error fetching response:", error);
    return NextResponse.json(
      { error: "Failed to fetch response" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existing = await prisma.questionnaireResponse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sanitize responses if provided
    let sanitizedResponses = body.responses ?? existing.responses;
    if (sanitizedResponses && typeof sanitizedResponses === "object") {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(sanitizedResponses)) {
        if (typeof value === "string") {
          sanitized[key] = sanitizeString(value);
        } else {
          sanitized[key] = value;
        }
      }
      sanitizedResponses = sanitized;
    }

    // Sanitize status if provided
    const sanitizedStatus = body.status 
      ? sanitizeString(String(body.status))
      : existing.status;

    const response = await prisma.questionnaireResponse.update({
      where: { id },
      data: {
        responses: sanitizedResponses,
        currentSection: body.currentSection ?? existing.currentSection,
        status: sanitizedStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error updating response:", error);
    return NextResponse.json(
      { error: "Failed to update response" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership
    const existing = await prisma.questionnaireResponse.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Response not found" },
        { status: 404 }
      );
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.questionnaireResponse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
