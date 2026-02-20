/**
 * Component that displays a list of uploaded prenup documents
 * Used in questionnaires to help users reference their prenup while answering questions
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrenupDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  uploadedAt: string;
}

interface PrenupDocumentsListProps {
  className?: string;
  variant?: "compact" | "full";
}

export function PrenupDocumentsList({ className, variant = "compact" }: PrenupDocumentsListProps) {
  const [documents, setDocuments] = useState<PrenupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents/prenup");
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading your prenup documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return null; // Don't show anything if no documents
  }

  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-sm font-medium text-gray-700">Your uploaded prenup documents:</p>
        <div className="flex flex-wrap gap-2">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 border border-blue-200 rounded"
            >
              <FileText className="h-3 w-3" />
              {doc.fileName}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Your Prenup Documents
        </CardTitle>
        <CardDescription>
          Reference your uploaded prenup documents while answering these questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{doc.fileName}</span>
                <span className="text-xs text-gray-500">({doc.documentType})</span>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 ml-2"
              >
                View
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
