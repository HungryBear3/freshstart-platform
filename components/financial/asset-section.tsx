"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { Asset, AssetType, Ownership } from "@/lib/financial/types"
import { formatCurrency } from "@/lib/financial/utils"

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "vehicle", label: "Vehicle" },
  { value: "bank_account", label: "Bank Account" },
  { value: "investment", label: "Investment Account" },
  { value: "retirement", label: "Retirement Account" },
  { value: "business", label: "Business Interest" },
  { value: "personal_property", label: "Personal Property" },
  { value: "other", label: "Other" },
]

const OWNERSHIP_TYPES: { value: Ownership; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "joint", label: "Joint" },
  { value: "spouse", label: "Spouse's" },
]

interface AssetSectionProps {
  assets: Asset[]
  onChange: (assets: Asset[]) => void
}

export function AssetSection({ assets, onChange }: AssetSectionProps) {
  const addAsset = () => {
    onChange([
      ...assets,
      {
        type: "real_estate",
        description: "",
        value: 0,
        ownership: "individual",
      },
    ])
  }

  const updateAsset = (index: number, updates: Partial<Asset>) => {
    const updated = [...assets]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeAsset = (index: number) => {
    onChange(assets.filter((_, i) => i !== index))
  }

  const calculateTotalValue = () => {
    return assets.reduce((total, asset) => total + asset.value, 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Assets</h3>
        <Button onClick={addAsset} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No assets added. Click "Add Asset" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Asset Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={asset.type}
                      onChange={(e) =>
                        updateAsset(index, { type: e.target.value as AssetType })
                      }
                    >
                      {ASSET_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={asset.description}
                      onChange={(e) =>
                        updateAsset(index, { description: e.target.value })
                      }
                      placeholder="e.g., 2019 Toyota Camry, Primary Residence"
                    />
                  </div>

                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={asset.value || ""}
                      onChange={(e) =>
                        updateAsset(index, { value: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label>Ownership</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={asset.ownership}
                      onChange={(e) =>
                        updateAsset(index, { ownership: e.target.value as Ownership })
                      }
                    >
                      {OWNERSHIP_TYPES.map((own) => (
                        <option key={own.value} value={own.value}>
                          {own.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(index)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {assets.length > 0 && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Asset Value:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatCurrency(calculateTotalValue())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
