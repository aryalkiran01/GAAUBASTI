import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Listing } from "@/types";

interface ListingDeleteDialogProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (listing: Listing) => void;
}

export default function ListingDeleteDialog({ listing, isOpen, onClose, onDelete }: ListingDeleteDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    if (!listing) return;
    onDelete(listing);
    toast({ title: "Listing deleted", description: `${listing.title} has been deleted.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Listing</DialogTitle>
        </DialogHeader>
        <p className="py-4">Are you sure you want to delete listing "{listing?.title}"?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
