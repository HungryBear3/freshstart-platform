/**
 * Admin page to seed sample questionnaires
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function SeedQuestionnairesPage() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/seed-questionnaires", {
        method: "POST",
        credentials: "include", // Ensure cookies are sent
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed questionnaires");
      }

      setResult({
        success: true,
        message: data.message || "Questionnaires seeded successfully!",
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to seed questionnaires",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Seed Questionnaires</h1>
        <p className="text-gray-600 mb-8">
          This will create sample questionnaires in the database:
        </p>
        <ul className="list-disc list-inside mb-8 space-y-2 text-gray-700">
          <li>Petition for Dissolution of Marriage</li>
          <li>Financial Affidavit (Short Form)</li>
          <li>Parenting Plan</li>
        </ul>

        <Card className="p-6">
          <div className="space-y-4">
            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full"
            >
              {isSeeding ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Seeding Questionnaires...
                </>
              ) : (
                "Seed Questionnaires"
              )}
            </Button>

            {result && (
              <div
                className={`p-4 rounded-md ${
                  result.success
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <p className="font-medium">
                  {result.success ? "✓ Success" : "✗ Error"}
                </p>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
