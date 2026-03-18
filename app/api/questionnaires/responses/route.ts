/**
 * API route for managing questionnaire responses
 * GET: Get user's responses
 * POST: Save or update a response
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { sanitizeString } from "@/lib/security/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const formType = searchParams.get("formType");

    const where: any = {
      userId: session.user.id,
    };

    if (formType) {
      where.formType = formType;
    }

    const responses = await prisma.questionnaireResponse.findMany({
      where,
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    let { formType, responses, currentSection, status, questionnaireId } = body;

    if (!formType || !responses) {
      return NextResponse.json(
        { error: "Missing required fields: formType, responses" },
        { status: 400 }
      );
    }

    // Sanitize formType
    formType = sanitizeString(String(formType));

    // Sanitize all string values in responses object
    if (responses && typeof responses === "object") {
      const sanitizedResponses: Record<string, any> = {};
      for (const [key, value] of Object.entries(responses)) {
        if (typeof value === "string") {
          sanitizedResponses[key] = sanitizeString(value);
        } else {
          sanitizedResponses[key] = value; // Keep non-string values as-is (numbers, booleans, etc.)
        }
      }
      responses = sanitizedResponses;
    }

    // Check if response already exists
    const existing = await prisma.questionnaireResponse.findFirst({
      where: {
        userId: session.user.id,
        formType,
      },
    });

    // If a questionnaireId is provided, ensure it exists; otherwise omit to avoid FK errors
    let questionnaireIdToSave: string | null = null;
    if (questionnaireId) {
      const exists = await prisma.questionnaire.findUnique({ where: { id: questionnaireId } });
      questionnaireIdToSave = exists ? questionnaireId : null;
    }

    let response;
    if (existing) {
      // Update existing response
      response = await prisma.questionnaireResponse.update({
        where: { id: existing.id },
        data: {
          responses,
          currentSection: currentSection ?? existing.currentSection,
          status: status ?? existing.status,
          updatedAt: new Date(),
          questionnaireId: questionnaireIdToSave ?? existing.questionnaireId,
        },
      });
    } else {
      // Create new response
      response = await prisma.questionnaireResponse.create({
        data: {
          userId: session.user.id,
          questionnaireId: questionnaireIdToSave,
          formType,
          responses,
          currentSection: currentSection ?? 0,
          status: status ?? "draft",
        },
      });
    }

    return NextResponse.json({ response }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Error saving response:", error);
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 }
    );
  }
}
