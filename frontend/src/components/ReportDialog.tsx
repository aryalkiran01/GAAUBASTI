/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Flag, Loader2 } from "lucide-react";

interface ReportDialogProps {
  entityType: "listing" | "user" | "review";
  entityId: string;
  trigger?: React.ReactNode;
}

const REASONS: Record<string, string[]> = {
  listing: [
    "Misleading photos or description",
    "Scam or fraudulent listing",
    "Inappropriate content",
    "Safety concern",
    "Other",
  ],
  user: [
    "Harassment or threatening behavior",
    "Scam or fraud",
    "Impersonation",
    "Hate speech",
    "Other",
  ],
  review: [
    "Fraudulent or fake review",
    "Hate speech or harassment",
    "Spam",
    "Off-topic",
    "Other",
  ],
};

export default function ReportDialog({ entityType, entityId, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login required", description: "Please log in to report content." });
      return;
    }
    if (!reason) {
      toast({ variant: "destructive", title: "Reason required", description: "Please select a reason for your report." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await reportsAPI.createReport({
        reportedEntityType: entityType,
        reportedEntityId: entityId,
        reason,
        description: description.trim(),
      });
      if (res.success) {
        toast({ title: "Report submitted", description: "Thank you. Our team will review your report." });
        setOpen(false);
        setReason("");
        setDescription("");
      } else {
        toast({ variant: "destructive", title: "Failed to submit", description: res.message || "Please try again." });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed to submit", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="h-3.5 w-3.5 mr-1.5" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {entityType}</DialogTitle>
          <DialogDescription>
            Help us keep the community safe. Our team reviews all reports.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS[entityType]?.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              rows={3}
              className="mt-1.5"
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
