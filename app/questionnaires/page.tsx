/**
 * Questionnaire selection page
 * Lists all available questionnaires for the user to start
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function QuestionnairesPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get all active questionnaires
  const questionnaires = await prisma.questionnaire.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get user's existing responses
  const responses = await prisma.questionnaireResponse.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Create a map of formType to response status
  const responseMap = new Map<string, { id: string; status: string }>(
    responses.map(
      (
        r: {
          id: string;
          formType: string;
          status: string;
        }
      ) => [r.formType, { id: r.id, status: r.status }]
    )
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Questionnaires</h1>
        <p className="text-gray-600 mb-8">
          Complete questionnaires to generate your divorce documents. You can save your progress and return later.
        </p>

        {questionnaires.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">
              No questionnaires are available at this time. Please check back later.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {questionnaires.map(
              (
                questionnaire: {
                  type: string;
                  structure?: any;
                  [key: string]: any;
                }
              ) => {
              const response = responseMap.get(questionnaire.type);
              const structure = questionnaire.structure as any;
              const estimatedTime = structure?.metadata?.estimatedTime;

              return (
                <Card key={questionnaire.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">
                        {questionnaire.name}
                      </h2>
                      {questionnaire.description && (
                        <p className="text-gray-600 mb-4">
                          {questionnaire.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500">
                        {estimatedTime && (
                          <span>⏱️ Estimated time: {estimatedTime} minutes</span>
                        )}
                        {response && (
                          <span
                            className={
                              response.status === "completed"
                                ? "text-green-600"
                                : response.status === "draft"
                                ? "text-yellow-600"
                                : "text-gray-600"
                            }
                          >
                            Status: {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/questionnaires/${questionnaire.type}`}>
                        <Button>
                          {response ? "Continue" : "Start"}
                        </Button>
                      </Link>
                      {response?.status === "completed" && (
                        <Link href="/documents">
                          <Button variant="outline">Go to Documents</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
