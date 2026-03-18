"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FileCheck } from "lucide-react";

interface SpouseAffidavitUploadProps {
  onUploadComplete: (documentId: string, fileName: string) => void;
  onCancel?: () => void;
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,image/jpeg,image/png";
const MAX_SIZE_MB = 10;

export function SpouseAffidavitUpload({
  onUploadComplete,
  onCancel,
}: SpouseAffidavitUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorizationConfirmed", "true");

      const res = await fetch("/api/documents/spouse-affidavit/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      onUploadComplete(json.document.id, json.document.fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Spouse&apos;s Financial Affidavit
        </CardTitle>
        <CardDescription>
          Upload a PDF or image of your spouse&apos;s affidavit. You will then enter the key
          data for comparison. Accepted: PDF, Word, JPEG, PNG (max {MAX_SIZE_MB}MB).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {file ? (
              <>
                <FileCheck className="h-4 w-4 mr-2 text-green-600" />
                {file.name}
              </>
            ) : (
              "Choose File"
            )}
          </Button>
          {file && (
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
