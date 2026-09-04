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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { disputesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DisputeDialogProps {
  bookingId: string;
  trigger?: React.ReactNode;
}

const CATEGORIES = [
  { value: "property_misrepresentation", label: "Property misrepresentation" },
  { value: "payment", label: "Payment issue" },
  { value: "damages", label: "Property damages" },
  { value: "safety", label: "Safety concern" },
  { value: "host_no_show", label: "Host no-show" },
  { value: "guest_no_show", label: "Guest no-show" },
  { value: "other", label: "Other" },
];

export default function DisputeDialog({ bookingId, trigger }: DisputeDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login required", description: "Please log in to raise a dispute." });
      return;
    }
    if (!subject || !description) {
      toast({ variant: "destructive", title: "Required fields", description: "Subject and description are required." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await disputesAPI.createDispute({ booking: bookingId, subject, description, category });
      if (res.success) {
        toast({ title: "Dispute raised", description: "Our team will review your dispute and respond shortly." });
        setOpen(false);
        setSubject("");
        setDescription("");
        setCategory("other");
      } else {
        toast({ variant: "destructive", title: "Failed", description: res.message });
      }
    } catch {
      toast({ variant: "destructive", title: "Failed", description: "Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Raise Dispute
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise a Dispute</DialogTitle>
          <DialogDescription>
            If you have a serious issue with this booking, raise a dispute and our team will investigate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="d-subject">Subject</Label>
            <Input id="d-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-1.5" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="d-description">Description</Label>
            <Textarea id="d-description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1.5" maxLength={2000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Submit Dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
