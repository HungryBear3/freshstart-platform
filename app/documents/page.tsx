/**
 * Documents page - Lists all generated documents for the user
 */

import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenerateDocumentButton } from "@/components/documents/generate-document-button";
import { DocumentActions } from "@/components/documents/document-actions";
import { PrenupUpload } from "@/components/documents/prenup-upload";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user's documents (include questionnaireResponse for edit/regenerate)
  const documents = await prisma.document.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      questionnaireResponse: {
        select: { id: true, formType: true },
      },
    },
    orderBy: {
      generatedAt: "desc",
    },
  });

  // Check if user has prenup-related questionnaire responses
  const petitionResponse = await prisma.questionnaireResponse.findFirst({
    where: {
      userId: session.user.id,
      formType: "petition",
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Check for prenup - responses might use question ID "has-prenup" or fieldName "hasPrenup"
  let hasPrenup = false;
  if (petitionResponse?.responses) {
    const responses = petitionResponse.responses as any;
    // Try both fieldName (hasPrenup) and question ID (has-prenup)
    const prenupValue = responses.hasPrenup || responses['has-prenup'];
    hasPrenup = prenupValue === "yes";
  }

  // Get user's completed questionnaires
  const completedQuestionnaires = await prisma.questionnaireResponse.findMany({
    where: {
      userId: session.user.id,
      status: "completed",
    },
    include: {
      questionnaire: true,
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600";
      case "draft":
        return "text-yellow-600";
      case "filed":
        return "text-blue-600";
      case "accepted":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDocumentType = (type: string) => {
    return type
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDateTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documents</h1>
            <p className="text-gray-600">
              View and manage your generated divorce documents
            </p>
          </div>
          <Link href="/questionnaires">
            <Button>Start New Questionnaire</Button>
          </Link>
        </div>

        {/* Prenup Upload Section - Show if user indicated they have a prenup */}
        {hasPrenup && (
          <div className="mb-8">
            <PrenupUpload userId={session.user.id} />
          </div>
        )}

        {/* Documents list */}
        {documents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600 mb-4">
              You haven&apos;t generated any documents yet.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Complete a questionnaire to generate your documents.
            </p>
            <Link href="/questionnaires">
              <Button>Go to Questionnaires</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {            documents.map(
              (
                document: {
                  id: string
                  fileName: string
                  type: string
                  status: string
                  mimeType?: string
                  generatedAt: string | Date
                  questionnaireResponse?: { id: string; formType: string } | null
                }
              ) => (
              <Card key={document.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold">
                        {document.fileName}
                      </h2>
                      {document.mimeType === "application/pdf" && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                          PDF
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                      <span>Type: {formatDocumentType(document.type)}</span>
                      <span className={getStatusColor(document.status)}>
                        Status: {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Generated: {formatDateTime(document.generatedAt)}
                    </p>
                  </div>
                  <DocumentActions 
                    documentId={document.id} 
                    fileName={document.fileName}
                    questionnaireResponseId={document.questionnaireResponse?.id}
                    formType={document.questionnaireResponse?.formType}
                    documentType={document.type}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Completed questionnaires that can generate documents */}
        {completedQuestionnaires.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to Generate Documents</h2>
            <div className="space-y-4">
              {completedQuestionnaires.map(
                (
                  response: {
                    id: string
                    questionnaire?: { name?: string | null } | null
                    formType: string
                    updatedAt: string | Date
                  }
                ) => (
                <Card key={response.id} className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {response.questionnaire?.name || response.formType}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Completed on {new Date(response.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <GenerateDocumentButton
                      questionnaireResponseId={response.id}
                      documentType={response.formType}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
