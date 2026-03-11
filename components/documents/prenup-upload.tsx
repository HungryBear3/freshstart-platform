/**
 * Component for uploading prenuptial/postnuptial agreement documents
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { validateFile } from "@/lib/utils/file-validation";
import { analytics } from "@/lib/analytics/events";

interface PrenupDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: "prenup" | "postnup" | "amendment";
  uploadedAt: Date;
}

interface PrenupUploadProps {
  userId: string;
  onUploadComplete?: (document: PrenupDocument) => void;
}

export function PrenupUpload({ userId, onUploadComplete }: PrenupUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<PrenupDocument[]>([]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation (basic checks - server does full validation)
    const validation = validateFile(file, ["application/pdf", "image/jpeg", "image/png", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"], 10);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }
    // Note: Server-side validation includes magic number checks and is more thorough

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "prenup"); // Default to prenup, can be changed
      formData.append("userId", userId);

      const response = await fetch("/api/documents/prenup/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      const newDocument: PrenupDocument = {
        id: data.document.id,
        fileName: data.document.fileName,
        fileUrl: data.document.fileUrl,
        fileType: data.document.documentType,
        uploadedAt: new Date(data.document.uploadedAt),
      };

      setUploadedDocuments([...uploadedDocuments, newDocument]);
      setSuccess(`Successfully uploaded ${file.name}`);
      
      // Track document upload
      analytics.prenupDocumentUpload(
        newDocument.fileType as "prenup" | "postnup" | "amendment",
        file.size
      );
      
      if (onUploadComplete) {
        onUploadComplete(newDocument);
      }

      // Clear file input
      event.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/prenup/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setUploadedDocuments(uploadedDocuments.filter((doc) => doc.id !== documentId));
      setSuccess("Document deleted successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Prenuptial / Postnuptial Agreement Documents
        </CardTitle>
        <CardDescription>
          If you have a copy of your prenup or postnup (and any amendments), you can upload it here to keep it organized with your other case documents. We don't decide if the agreement is valid or enforceable—we just help you stay organized.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="prenup-upload"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="prenup-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className={`h-8 w-8 text-gray-400 ${uploading ? "animate-pulse" : ""}`} />
            <span className="text-sm font-medium text-gray-700">
              {uploading ? "Uploading..." : "Click to upload prenup/postnup document"}
            </span>
            <span className="text-xs text-gray-500">
              PDF, Word, or images up to 10MB
            </span>
          </label>
        </div>

        {uploading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading document...
          </div>
        )}

        {uploadedDocuments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            {uploadedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate"
                  >
                    {doc.fileName}
                  </a>
                  <span className="text-xs text-gray-500">
                    ({doc.fileType})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
