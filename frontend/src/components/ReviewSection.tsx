import { useState, useEffect } from "react";
import { reviewsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Star, Flag } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Review {
  id: string;
  guest: {
    name: string;
    avatar?: string;
  } | null; // Allow guest to be null
  rating: number;
  comment: string;
  createdAt: string;
  ratings?: {
    cleanliness?: number;
    communication?: number;
    checkIn?: number;
    accuracy?: number;
    location?: number;
    value?: number;
  };
}

interface ReviewSectionProps {
  listingId: string;
  canReview?: boolean;
  bookingId?: string;
}

export default function ReviewSection({ listingId, canReview = false, bookingId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: "",
    ratings: {
      cleanliness: 5,
      communication: 5,
      checkIn: 5,
      accuracy: 5,
      location: 5,
      value: 5
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewsAPI.getListingReviews(listingId);
        if (response.success) {
          setReviews(response.data.reviews);
        }
      } catch {
        // Silently fall back to an empty reviews list; the UI can render without it.
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "You must be logged in",
        description: "Please log in to submit a review.",
      });
      return;
    }

    if (!bookingId) {
      toast({
        variant: "destructive",
        title: "Booking not found",
        description: "Cannot submit review without a valid booking.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await reviewsAPI.createReview({
        listingId,
        bookingId,
        ...newReview
      });

      if (response.success) {
        setReviews([response.data.review, ...reviews]);
        setShowReviewForm(false);
        setNewReview({
          rating: 5,
          comment: "",
          ratings: {
            cleanliness: 5,
            communication: 5,
            checkIn: 5,
            accuracy: 5,
            location: 5,
            value: 5
          }
        });
        toast({
          title: "Review submitted",
          description: "Thank you for your review!",
        });
      } else {
        throw new Error(response.message || "Failed to submit review");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Review failed",
        description: error.message || "Failed to submit review",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-medium">Reviews</h3>
        {canReview && user && (
          <Button 
            onClick={() => setShowReviewForm(true)}
            className="bg-gaun-green hover:bg-gaun-light-green"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gaun-cream/30 p-6 rounded-lg">
          <h4 className="text-lg font-medium mb-4">Share your experience</h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <Label>Overall Rating</Label>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewReview({...newReview, rating: i + 1})}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${i < newReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Share your experience..."
                rows={4}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div>Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => {
            const guestName = review.guest?.name || "Guest";
            const guestAvatar = review.guest?.avatar || "https://img.freepik.com/premium-photo/memoji-emoji-handsome-smiling-man-white-background_826801-6987.jpg?semt=ais_hybrid&w=740&q=80";

            return (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={guestAvatar}
                      alt={guestName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{guestName}</h4>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(review.createdAt), "MMMM yyyy")}
                    </p>
                    <p className="text-sm">{review.comment}</p>
                    {user && (
                      <button
                        type="button"
                        onClick={() => setFlaggingReviewId(review.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Flag className="h-3 w-3" />
                        Report
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this place!
          </div>
        )}
      </div>

      <Dialog open={!!flaggingReviewId} onOpenChange={(open) => { if (!open) { setFlaggingReviewId(null); setFlagReason(""); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-destructive" />
              Report Review
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={flagReason} onValueChange={setFlagReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                <SelectItem value="Spam or misleading">Spam or misleading</SelectItem>
                <SelectItem value="Harassment">Harassment</SelectItem>
                <SelectItem value="Fake review">Fake review</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFlaggingReviewId(null); setFlagReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={flagSubmitting || !flagReason}
              onClick={async () => {
                if (!flaggingReviewId) return;
                setFlagSubmitting(true);
                try {
                  const response = await reviewsAPI.flagReview(flaggingReviewId, flagReason);
                  if (response.success) {
                    toast({ title: "Review reported", description: "Thank you. Our team will review it." });
                    setFlaggingReviewId(null);
                    setFlagReason("");
                  } else {
                    throw new Error(response.message || "Failed to flag review");
                  }
                } catch (error: any) {
                  toast({ variant: "destructive", title: "Failed", description: error.message });
                } finally {
                  setFlagSubmitting(false);
                }
              }}
            >
              {flagSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
