"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthorizationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AuthorizationDialog({ open, onConfirm, onCancel }: AuthorizationDialogProps) {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  const allChecked = checked1 && checked2 && checked3;

  const handleConfirm = () => {
    if (allChecked) onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Authorization Required</DialogTitle>
          <DialogDescription>
            Before entering or uploading your spouse&apos;s financial information, you must confirm
            the following:
          </DialogDescription>
        </DialogHeader>
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            You are responsible for ensuring you have legal authorization to possess and use your
            spouse&apos;s financial information. FreshStart IL does not verify or validate
            authorization.
          </AlertDescription>
        </Alert>
        <div className="space-y-4 py-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={checked1}
              onCheckedChange={(v) => setChecked1(!!v)}
              className="mt-1"
            />
            <span className="text-sm">
              I obtained this financial information through legal means (e.g., discovery,
              court-ordered disclosure, or my spouse voluntarily provided it).
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={checked2}
              onCheckedChange={(v) => setChecked2(!!v)}
              className="mt-1"
            />
            <span className="text-sm">
              I have authorization to use this information for comparison purposes in my divorce
              proceedings.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={checked3}
              onCheckedChange={(v) => setChecked3(!!v)}
              className="mt-1"
            />
            <span className="text-sm">
              I understand the privacy implications and will use this tool only for lawful
              comparison purposes.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allChecked}>
            I Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
