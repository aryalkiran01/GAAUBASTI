
import { useState } from "react";
import { Listing } from "@/types";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ListingEditDialogProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedListing: Listing) => void;
}

export default function ListingEditDialog({ listing, isOpen, onClose, onSave }: ListingEditDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(listing?.title || "");
  const [description, setDescription] = useState(listing?.description || "");
  const [location, setLocation] = useState(listing?.location || "");
  const [price, setPrice] = useState(listing?.price || 0);

  const handleSave = () => {
    if (!listing) return;
    
    if (!title.trim() || !location.trim() || price <= 0) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: "Title, location and price are required",
      });
      return;
    }

    const updatedListing: Listing = {
      ...listing,
      title,
      description,
      location,
      price: Number(price),
    };

    onSave(updatedListing);
    toast({
      title: "Listing updated",
      description: "Listing information has been updated successfully",
    });
  };

  // Reset form when listing changes
  useState(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setLocation(listing.location);
      setPrice(listing.price);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="col-span-3"
            />
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
