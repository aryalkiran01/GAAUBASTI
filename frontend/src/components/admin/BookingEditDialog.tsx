
import { useState } from "react";
import { Booking } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface BookingEditDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBooking: Booking) => void;
}

export default function BookingEditDialog({ booking, isOpen, onClose, onSave }: BookingEditDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<Booking["status"]>(booking?.status || "pending");

  const handleSave = () => {
    if (!booking) return;
    
    const updatedBooking: Booking = {
      ...booking,
      status,
    };

    onSave(updatedBooking);
    toast({
      title: "Booking updated",
      description: `Booking status changed to ${status}`,
    });
  };

  // Reset form when booking changes
  useState(() => {
    if (booking) {
      setStatus(booking.status);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Booking Status</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Booking ID: {booking?.id}</p>
            <p className="text-sm">
              {booking && `${format(booking.startDate, "MMM d")} - ${format(booking.endDate, "MMM d, yyyy")}`}
            </p>
            <p className="text-sm">Total: ${booking?.totalPrice}</p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as Booking["status"])}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
