/**
 * Client component for generating documents from questionnaire responses
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface GenerateDocumentButtonProps {
  questionnaireResponseId: string;
  documentType: string;
  onSuccess?: () => void;
}

export function GenerateDocumentButton({
  questionnaireResponseId,
  documentType,
  onSuccess,
}: GenerateDocumentButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionnaireResponseId,
          documentType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate document");
      }

      const data = await response.json();
      
      // Show success message
      alert(`Document generation initiated! ${data.message || ""}`);
      
      // Refresh the page or call onSuccess callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate document";
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate Document"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
