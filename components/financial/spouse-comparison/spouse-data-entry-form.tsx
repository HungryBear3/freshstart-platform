"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { SpouseFinancialData } from "@/lib/financial/comparison";
import type { IncomeSource, Expense, Asset, Debt } from "@/lib/financial/types";

const INCOME_TYPES = ["wages", "self_employment", "rental", "investment", "social_security", "pension", "other"];
const EXPENSE_CATEGORIES = ["housing", "utilities", "food", "transportation", "healthcare", "childcare", "insurance", "other"];
const ASSET_TYPES = ["real_estate", "vehicle", "bank_account", "investment", "retirement", "other"];
const DEBT_TYPES = ["mortgage", "auto_loan", "credit_card", "student_loan", "personal_loan", "medical", "other"];

const formatLabel = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

interface SpouseDataEntryFormProps {
  initialData?: SpouseFinancialData | null;
  onSave: (data: SpouseFinancialData) => Promise<void>;
  onCancel?: () => void;
}

const emptyRow = {
  income: (): IncomeSource => ({ type: "wages", source: "", amount: 0, frequency: "monthly", isCurrent: true }),
  expense: (): Expense => ({ category: "housing", description: "", amount: 0, frequency: "monthly" }),
  asset: (): Asset => ({ type: "bank_account", description: "", value: 0, ownership: "joint" }),
  debt: (): Debt => ({ type: "credit_card", creditor: "", balance: 0, ownership: "joint" }),
};

export function SpouseDataEntryForm({
  initialData,
  onSave,
  onCancel,
}: SpouseDataEntryFormProps) {
  const [income, setIncome] = useState<IncomeSource[]>(
    initialData?.income?.length ? initialData.income : [emptyRow.income()]
  );
  const [expenses, setExpenses] = useState<Expense[]>(
    initialData?.expenses?.length ? initialData.expenses : [emptyRow.expense()]
  );
  const [assets, setAssets] = useState<Asset[]>(
    initialData?.assets?.length ? initialData.assets : [emptyRow.asset()]
  );
  const [debts, setDebts] = useState<Debt[]>(
    initialData?.debts?.length ? initialData.debts : [emptyRow.debt()]
  );
  const [saving, setSaving] = useState(false);

  const updateIncome = (i: number, f: Partial<IncomeSource>) => {
    setIncome((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...f } : item)));
  };
  const updateExpense = (i: number, f: Partial<Expense>) => {
    setExpenses((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...f } : item)));
  };
  const updateAsset = (i: number, f: Partial<Asset>) => {
    setAssets((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...f } : item)));
  };
  const updateDebt = (i: number, f: Partial<Debt>) => {
    setDebts((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...f } : item)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ income, expenses, assets, debts });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spouse&apos;s Income</CardTitle>
          <CardDescription>Enter income sources from your spouse&apos;s Financial Affidavit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {income.map((item, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <Select value={item.type} onValueChange={(v) => updateIncome(i, { type: v as IncomeSource["type"] })}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Source (e.g. Employer)"
                value={item.source}
                onChange={(e) => updateIncome(i, { source: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount || ""}
                onChange={(e) => updateIncome(i, { amount: parseFloat(e.target.value) || 0 })}
                className="w-28"
              />
              <span className="text-sm text-gray-500">/mo</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIncome((p) => p.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setIncome((p) => [...p, emptyRow.income()])}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spouse&apos;s Expenses</CardTitle>
          <CardDescription>Monthly expenses from spouse&apos;s affidavit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.map((item, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <Select value={item.category} onValueChange={(v) => updateExpense(i, { category: v as Expense["category"] })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateExpense(i, { description: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount || ""}
                onChange={(e) => updateExpense(i, { amount: parseFloat(e.target.value) || 0 })}
                className="w-28"
              />
              <span className="text-sm text-gray-500">/mo</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpenses((p) => p.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setExpenses((p) => [...p, emptyRow.expense()])}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spouse&apos;s Assets</CardTitle>
          <CardDescription>Assets from spouse&apos;s affidavit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {assets.map((item, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <Select value={item.type} onValueChange={(v) => updateAsset(i, { type: v as Asset["type"] })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateAsset(i, { description: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <Input
                type="number"
                placeholder="Value"
                value={item.value || ""}
                onChange={(e) => updateAsset(i, { value: parseFloat(e.target.value) || 0 })}
                className="w-28"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAssets((p) => p.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setAssets((p) => [...p, emptyRow.asset()])}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spouse&apos;s Debts</CardTitle>
          <CardDescription>Debts and liabilities from spouse&apos;s affidavit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {debts.map((item, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <Select value={item.type} onValueChange={(v) => updateDebt(i, { type: v as Debt["type"] })}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Creditor"
                value={item.creditor}
                onChange={(e) => updateDebt(i, { creditor: e.target.value })}
                className="flex-1 min-w-[120px]"
              />
              <Input
                type="number"
                placeholder="Balance"
                value={item.balance || ""}
                onChange={(e) => updateDebt(i, { balance: parseFloat(e.target.value) || 0 })}
                className="w-28"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDebts((p) => p.filter((_, j) => j !== i))}
                className="text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setDebts((p) => [...p, emptyRow.debt()])}>
            <Plus className="h-4 w-4 mr-2" />
            Add Debt
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save & Compare"}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
