/**
 * Client component for document preview, download, edit, regenerate, and delete actions
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DocumentActionsProps {
  documentId: string;
  fileName: string;
  questionnaireResponseId?: string | null;
  formType?: string | null;
  documentType?: string;
}

export function DocumentActions({ 
  documentId, 
  fileName, 
  questionnaireResponseId, 
  formType, 
  documentType 
}: DocumentActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canEdit = !!questionnaireResponseId && !!formType;

  const handlePreview = () => {
    // Open in new tab for preview - serves from database
    window.open(`/api/documents/${documentId}`, "_blank");
  };

  const handleDownload = () => {
    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = `/api/documents/${documentId}?download=true`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerate = async () => {
    if (!questionnaireResponseId || !documentType) return;
    setIsRegenerating(true);
    try {
      const response = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          questionnaireResponseId,
          documentType,
          documentId, // Update existing document instead of creating new
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to regenerate document");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to regenerate document");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete document");
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-600">Delete this document?</span>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Yes, Delete"}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <Link href={`/questionnaires/${formType}?responseId=${questionnaireResponseId}&returnTo=documents`}>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </Link>
      )}
      {canEdit && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? "Regenerating…" : "Regenerate"}
        </Button>
      )}
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleDownload}
      >
        Download
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handlePreview}
      >
        Preview
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setShowDeleteConfirm(true)}
      >
        Delete
      </Button>
    </div>
  );
}
