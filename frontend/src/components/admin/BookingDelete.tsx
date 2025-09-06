import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Booking } from "@/types";

interface BookingDeleteDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (booking: Booking) => void;
}

export default function BookingDeleteDialog({ booking, isOpen, onClose, onDelete }: BookingDeleteDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    if (!booking) return;
    onDelete(booking);
    toast({ title: "Booking deleted", description: `Booking ID ${booking.id} has been deleted.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Booking</DialogTitle>
        </DialogHeader>
        <p className="py-4">Are you sure you want to delete this booking?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
