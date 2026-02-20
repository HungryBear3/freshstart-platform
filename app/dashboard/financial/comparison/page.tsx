"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, Loader2, AlertCircle, Edit, Trash2 } from "lucide-react";
import { AuthorizationDialog } from "@/components/financial/spouse-comparison/authorization-dialog";
import { SpouseDataEntryForm } from "@/components/financial/spouse-comparison/spouse-data-entry-form";
import type { SpouseFinancialData } from "@/lib/financial/comparison";
import type { Discrepancy } from "@/lib/financial/comparison";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function FinancialComparisonPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    userData: any;
    userTotals: any;
    spouseData: SpouseFinancialData | null;
    spouseTotals: any;
    authorizationConfirmed: boolean;
    discrepancies: Discrepancy[];
    hasUserData: boolean;
    hasSpouseData: boolean;
  } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financial/spouse-comparison");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAuthConfirm = () => {
    setShowAuthDialog(false);
    setShowEntryForm(true);
  };

  const handleSaveSpouseData = async (spouseData: SpouseFinancialData) => {
    const res = await fetch("/api/financial/spouse-comparison", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: spouseData,
        authorizationConfirmed: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save");
    }
    setShowEntryForm(false);
    fetchData();
  };

  const handleDeleteSpouseData = async () => {
    if (!confirm("Are you sure you want to delete all spouse financial data?")) return;
    const res = await fetch("/api/financial/spouse-comparison", { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    fetchData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
          <span>Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/financial"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 inline-flex items-center"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Financial Tools
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Spouse Financial Comparison</h1>
        <p className="text-gray-600 mb-8">
          Compare your financial affidavit with your spouse&apos;s to identify discrepancies and
          negotiation points.
        </p>

        {!data?.hasUserData && (
          <Alert className="mb-8 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Complete your own Financial Affidavit first before comparing.{" "}
              <Link href="/questionnaires/financial_affidavit" className="font-medium text-blue-700 underline">
                Complete Financial Affidavit
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {data?.hasUserData && !data.hasSpouseData && !showEntryForm && (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle>Add Spouse&apos;s Financial Data</CardTitle>
              <CardDescription>
                Enter your spouse&apos;s financial information from their affidavit for
                side-by-side comparison. You may have obtained this through discovery,
                court-ordered disclosure, or voluntary sharing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800 mb-4">
                You must confirm that you have legal authorization to possess and use this
                information before proceeding.
              </p>
              <Button onClick={() => setShowAuthDialog(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Enter Spouse&apos;s Financial Data
              </Button>
            </CardContent>
          </Card>
        )}

        {showEntryForm && data?.hasUserData && (
          <div className="mb-8">
            <SpouseDataEntryForm
              initialData={data?.spouseData}
              onSave={handleSaveSpouseData}
              onCancel={() => setShowEntryForm(false)}
            />
          </div>
        )}

        {data?.hasUserData && data?.hasSpouseData && !showEntryForm && (
          <>
            <div className="flex gap-4 mb-6">
              <Button variant="outline" size="sm" onClick={() => setShowEntryForm(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Spouse Data
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSpouseData}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Spouse Data
              </Button>
            </div>

            {data.discrepancies.length > 0 && (
              <Card className="mb-8 border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Discrepancies ({data.discrepancies.length})
                  </CardTitle>
                  <CardDescription>
                    These differences may require clarification or discussion with your attorney
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.discrepancies.map((d, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Badge variant="outline" className="shrink-0">
                          {d.category}
                        </Badge>
                        <span>{d.description}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Your Finances</CardTitle>
                  <CardDescription>From your Financial Affidavit</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.userTotals?.monthlyIncome ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Expenses</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(data.userTotals?.monthlyExpenses ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(data.userTotals?.totalAssets ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debts</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(data.userTotals?.totalDebts ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Net Worth</span>
                    <span
                      className={
                        (data.userTotals?.netWorth ?? 0) >= 0
                          ? "font-semibold text-green-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {formatCurrency(data.userTotals?.netWorth ?? 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600">Spouse&apos;s Finances</CardTitle>
                  <CardDescription>From entered affidavit data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.spouseTotals?.monthlyIncome ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Expenses</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(data.spouseTotals?.monthlyExpenses ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Assets</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(data.spouseTotals?.totalAssets ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debts</span>
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(data.spouseTotals?.totalDebts ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Net Worth</span>
                    <span
                      className={
                        (data.spouseTotals?.netWorth ?? 0) >= 0
                          ? "font-semibold text-green-600"
                          : "font-semibold text-red-600"
                      }
                    >
                      {formatCurrency(data.spouseTotals?.netWorth ?? 0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-gray-500">
              <strong>Disclaimer:</strong> This comparison is for informational purposes. You are
              responsible for ensuring you have legal authorization to possess and use your
              spouse&apos;s financial information. Consult with an attorney for legal advice.
            </p>
          </>
        )}
      </div>

      <AuthorizationDialog
        open={showAuthDialog}
        onConfirm={() => {
          setShowAuthDialog(false);
          setShowEntryForm(true);
        }}
        onCancel={() => setShowAuthDialog(false)}
      />
    </DashboardLayout>
  );
}
