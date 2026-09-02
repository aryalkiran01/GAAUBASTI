import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { reportsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Flag } from "lucide-react";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  entityType: "listing" | "user" | "message";
  entityId: string;
  entityName?: string;
}

const REASON_OPTIONS: Record<string, string[]> = {
  listing: [
    "Misleading photos or description",
    "Inappropriate content",
    "Safety concern",
    "Scam or fraud",
    "Other",
  ],
  user: [
    "Inappropriate behavior",
    "Harassment",
    "Scam or fraud",
    "Fake account",
    "Other",
  ],
  message: [
    "Harassment or threats",
    "Spam",
    "Inappropriate content",
    "Scam or fraud",
    "Other",
  ],
};

export default function ReportModal({ open, onClose, entityType, entityId, entityName }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Please log in to submit a report.",
      });
      return;
    }

    if (!reason) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please select a reason for your report.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await reportsAPI.createReport({
        reportedEntityType: entityType,
        reportedEntityId: entityId,
        reason,
        description: description.trim(),
      });

      if (response.success) {
        toast({
          title: "Report submitted",
          description: "Thank you. Our team will review your report.",
        });
        setReason("");
        setDescription("");
        onClose();
      } else {
        throw new Error(response.message || "Failed to submit report");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Report failed",
        description: error.message || "Failed to submit report",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-destructive" />
            Report {entityType}
          </DialogTitle>
          <DialogDescription>
            {entityName ? `Reporting "${entityName}"` : `Report this ${entityType}`}
            {" — "}our team will review your report and take appropriate action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS[entityType]?.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about the issue..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !reason}
          >
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
