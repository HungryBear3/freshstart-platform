/**
 * Admin page to create a test user account
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SimpleLayout } from "@/components/layouts/simple-layout";

export default function SeedTestUserPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; credentials?: { email: string; password: string } } | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/seed-test-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || errorData.details || "Failed to create test user");
      }

      const data = await response.json();

      setResult({
        success: true,
        message: data.message || "Test user created successfully!",
        credentials: data.credentials,
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to create test user. Check console for details.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SimpleLayout>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Test User</h1>
          <p className="text-gray-600">
            This will create a test user account for development and testing purposes.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test User Credentials</h2>
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <p className="text-sm">
              <span className="font-medium">Email:</span> test@example.com
            </p>
            <p className="text-sm">
              <span className="font-medium">Password:</span> test123456
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Note: This user will be automatically verified and ready to use.
          </p>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating Test User...
                </>
              ) : (
                "Create Test User"
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
                {result.success && result.credentials && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm font-medium mb-2">You can now sign in with:</p>
                    <p className="text-sm">
                      <strong>Email:</strong> {result.credentials.email}
                    </p>
                    <p className="text-sm">
                      <strong>Password:</strong> {result.credentials.password}
                    </p>
                    <a
                      href="/auth/signin"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Go to Sign In →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </SimpleLayout>
  );
}
