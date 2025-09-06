import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types";

interface UserDeleteDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (user: User) => void;
}

export default function UserDeleteDialog({ user, isOpen, onClose, onDelete }: UserDeleteDialogProps) {
  const { toast } = useToast();

  const handleDelete = () => {
    if (!user) return;
    onDelete(user);
    toast({ title: "User deleted", description: `${user.name} has been deleted.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
        </DialogHeader>
        <p className="py-4">Are you sure you want to delete user "{user?.name}"?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
