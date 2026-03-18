/**
 * API route for managing questionnaires
 * GET: List all active questionnaires
 * POST: Create a new questionnaire (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const questionnaires = await prisma.questionnaire.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ questionnaires });
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    return NextResponse.json(
      { error: "Failed to fetch questionnaires" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin check
    const body = await request.json();
    const { name, type, description, structure } = body;

    if (!name || !type || !structure) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, structure" },
        { status: 400 }
      );
    }

    const questionnaire = await prisma.questionnaire.create({
      data: {
        name,
        type,
        description,
        structure,
      },
    });

    return NextResponse.json({ questionnaire }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating questionnaire:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A questionnaire with this type already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create questionnaire" },
      { status: 500 }
    );
  }
}
