/**
 * Individual questionnaire page
 * Renders and manages a specific questionnaire
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QuestionnaireForm } from "@/components/questionnaires/questionnaire-form";
import { QuestionnaireStructure, QuestionnaireResponse } from "@/types/questionnaire";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card } from "@/components/ui/card";
import { PrenupGuidanceBanner } from "@/components/prenup/prenup-guidance-banner";
import { SafetyResources } from "@/components/prenup/safety-resources";
import { getPrenupStatus, checkPrenupSafetyConcerns, PrenupContext } from "@/lib/prenup/branching";
import { analytics } from "@/lib/analytics/events";

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;

  const [structure, setStructure] = useState<QuestionnaireStructure | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponse>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [prenupStatus, setPrenupStatus] = useState<"none" | "uncontested" | "disputed" | "unclear">("none");
  const [hasSafetyConcerns, setHasSafetyConcerns] = useState(false);

  const searchParams = useSearchParams();
  const responseIdFromUrl = searchParams.get("responseId");
  const returnTo = searchParams.get("returnTo");

  // Load questionnaire structure and existing responses
  useEffect(() => {
    async function loadQuestionnaire() {
      try {
        // Load questionnaire structure
        const res = await fetch(`/api/questionnaires/${type}`);
        if (!res.ok) {
          throw new Error("Questionnaire not found");
        }
        const data = await res.json();
        setStructure(data.questionnaire.structure as QuestionnaireStructure);

        // Load responses: specific response when responseId in URL, otherwise latest by formType
        if (responseIdFromUrl) {
          const responseRes = await fetch(`/api/questionnaires/responses/${responseIdFromUrl}`);
          if (responseRes.ok) {
            const responseData = await responseRes.json();
            const r = responseData.response;
            if (r && r.formType === type) {
              const loadedResponses = (r.responses as QuestionnaireResponse) || {};
              setResponses(loadedResponses);
              setCurrentSection(r.currentSection || 0);
              setResponseId(r.id);
              if (type === "petition") {
                const prenupContext = extractPrenupContext(loadedResponses);
                setPrenupStatus(getPrenupStatus(prenupContext));
                const safetyCheck = checkPrenupSafetyConcerns(prenupContext);
                setHasSafetyConcerns(safetyCheck.hasSafetyConcerns);
              }
            }
          }
        } else {
          const responseRes = await fetch(`/api/questionnaires/responses?formType=${type}`);
          if (responseRes.ok) {
            const responseData = await responseRes.json();
            if (responseData.responses && responseData.responses.length > 0) {
              const latestResponse = responseData.responses[0];
              const loadedResponses = (latestResponse.responses as QuestionnaireResponse) || {};
              setResponses(loadedResponses);
              setCurrentSection(latestResponse.currentSection || 0);
              setResponseId(latestResponse.id);
              if (type === "petition") {
                const prenupContext = extractPrenupContext(loadedResponses);
                setPrenupStatus(getPrenupStatus(prenupContext));
                const safetyCheck = checkPrenupSafetyConcerns(prenupContext);
                setHasSafetyConcerns(safetyCheck.hasSafetyConcerns);
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load questionnaire");
      } finally {
        setLoading(false);
      }
    }

    loadQuestionnaire();
  }, [type, responseIdFromUrl]);

  // Helper to extract prenup context from responses
  const extractPrenupContext = (resps: QuestionnaireResponse): PrenupContext => {
    // Try both fieldName (hasPrenup) and question ID (has-prenup)
    const hasPrenup = resps.hasPrenup || resps["has-prenup"] || "no";
    return {
      hasPrenup: hasPrenup as "yes" | "no" | "not_sure",
      prenupFollowStatus: (resps.prenupFollowStatus || resps["prenup-follow-status"]) as PrenupContext["prenupFollowStatus"],
      prenupType: (resps.prenupType || resps["prenup-type"]) as PrenupContext["prenupType"],
      prenupSignedState: (resps.prenupSignedState || resps["prenup-signed-state"]) as string,
      prenupIndependentCounsel: (resps.prenupIndependentCounsel || resps["prenup-independent-counsel"]) as PrenupContext["prenupIndependentCounsel"],
      prenupFullDisclosure: (resps.prenupFullDisclosure || resps["prenup-full-disclosure"]) as PrenupContext["prenupFullDisclosure"],
      // Safety-related fields
      prenupPressureIndicator: (resps.prenupPressureIndicator || resps["prenup-pressure-indicator"]) as PrenupContext["prenupPressureIndicator"],
      hasIndependentFinancialAccess: (resps.hasIndependentFinancialAccess || resps["has-independent-financial-access"]) as PrenupContext["hasIndependentFinancialAccess"],
    };
  };

  // Track when prenup section is started (when hasPrenup is answered)
  useEffect(() => {
    if (type === "petition" && responses.hasPrenup) {
      const hasPrenup = responses.hasPrenup || responses["has-prenup"];
      if (hasPrenup && hasPrenup !== "no") {
        analytics.prenupSectionStart(type);
      }
    }
  }, [type, responses.hasPrenup, responses["has-prenup"]]);

  // Update prenup status and safety concerns when responses change (for petition questionnaires)
  useEffect(() => {
    if (type === "petition" && Object.keys(responses).length > 0) {
      const prenupContext = extractPrenupContext(responses);
      const newStatus = getPrenupStatus(prenupContext);
      const safetyCheck = checkPrenupSafetyConcerns(prenupContext);
      
      // Track status classification when it changes
      if (newStatus !== prenupStatus && newStatus !== "none") {
        analytics.prenupStatusClassified(newStatus);
      }
      
      // Track safety concerns when detected
      if (safetyCheck.hasSafetyConcerns && !hasSafetyConcerns) {
        analytics.prenupSafetyConcernsDetected(safetyCheck.safetyConcerns);
      }
      
      setPrenupStatus(newStatus);
      setHasSafetyConcerns(safetyCheck.hasSafetyConcerns);
      
      // Track section completion when all prenup questions are answered
      const hasPrenup = prenupContext.hasPrenup;
      if (hasPrenup === "yes" && prenupContext.prenupFollowStatus) {
        analytics.prenupSectionComplete(type, true);
      } else if (hasPrenup === "no" || hasPrenup === "not_sure") {
        analytics.prenupSectionComplete(type, false);
      }
    }
  }, [responses, type, prenupStatus, hasSafetyConcerns]);

  const handleSave = async (savedResponses: QuestionnaireResponse, section: number) => {
    try {
      const url = responseId
        ? `/api/questionnaires/responses/${responseId}`
        : "/api/questionnaires/responses";
      const method = responseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: type,
          responses: savedResponses,
          currentSection: section,
          status: "draft",
          questionnaireId: structure?.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      const data = await res.json();
      if (data.response && !responseId) {
        setResponseId(data.response.id);
      }
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  };

  const handleSubmit = async (submittedResponses: QuestionnaireResponse) => {
    try {
      const url = responseId
        ? `/api/questionnaires/responses/${responseId}`
        : "/api/questionnaires/responses";
      const method = responseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: type,
          responses: submittedResponses,
          currentSection: currentSection,
          status: "completed",
          questionnaireId: structure?.id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      // Redirect to documents page (or returnTo if specified)
      router.push(returnTo === "documents" ? "/documents" : "/documents");
    } catch (err) {
      console.error("Submit failed:", err);
      alert("Failed to submit questionnaire. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !structure) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">
            {error || "Questionnaire not found"}
          </p>
          <button
            onClick={() => router.push("/questionnaires")}
            className="text-blue-600 hover:underline"
          >
            Return to questionnaires
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(returnTo === "documents" ? "/documents" : "/questionnaires")}
            className="text-blue-600 hover:underline mb-4"
          >
            ← Back to {returnTo === "documents" ? "documents" : "questionnaires"}
          </button>
          <h1 className="text-3xl font-bold">{structure.name}</h1>
          {structure.description && (
            <p className="text-gray-600 mt-2">{structure.description}</p>
          )}
        </div>

        {/* Show edit mode banner when editing a document's source data */}
        {responseIdFromUrl && returnTo === "documents" && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Editing document source data.</strong> Make your changes below and save. When done, go back to Documents and click &quot;Regenerate&quot; to update your PDF.
            </p>
          </div>
        )}

        {/* Show prenup guidance banner for petition questionnaires when prenup is detected */}
        {type === "petition" && prenupStatus !== "none" && (
          <div className="mb-6">
            <PrenupGuidanceBanner 
              status={prenupStatus}
              onView={() => analytics.prenupGuidanceBannerView(prenupStatus)}
            />
          </div>
        )}

        {/* Show safety resources when safety concerns are detected */}
        {type === "petition" && hasSafetyConcerns && (
          <div className="mb-6">
            <SafetyResources 
              variant="card"
              onView={() => analytics.prenupSafetyResourcesView()}
            />
          </div>
        )}

        <QuestionnaireForm
          structure={structure}
          initialResponses={responses}
          onSave={handleSave}
          onSubmit={handleSubmit}
          onResponsesChange={(newResponses) => {
            setResponses(newResponses);
            // Update prenup status and safety concerns in real-time for petition questionnaires
            if (type === "petition") {
              const prenupContext = extractPrenupContext(newResponses);
              setPrenupStatus(getPrenupStatus(prenupContext));
              const safetyCheck = checkPrenupSafetyConcerns(prenupContext);
              setHasSafetyConcerns(safetyCheck.hasSafetyConcerns);
            }
          }}
          autoSave={true}
          autoSaveDelay={2000}
        />
      </div>
    </div>
  );
}
