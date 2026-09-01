import { useState, useEffect } from "react";
import { reviewsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Star, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";

interface Review {
  id: string;
  guest: {
    name: string;
    avatar?: string;
  } | null;
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
      value: 5,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewsAPI.getListingReviews(listingId);
        if (response.success) {
          setReviews(response.data.reviews);
        }
      } catch (error) {
        console.warn("Failed to fetch reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ variant: "destructive", title: "You must be logged in", description: "Please log in to submit a review." });
      return;
    }

    if (!bookingId) {
      toast({ variant: "destructive", title: "Booking not found", description: "Cannot submit review without a valid booking." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await reviewsAPI.createReview({ listingId, bookingId, ...newReview });

      if (response.success) {
        setReviews([response.data.review, ...reviews]);
        setShowReviewForm(false);
        setNewReview({
          rating: 5,
          comment: "",
          ratings: { cleanliness: 5, communication: 5, checkIn: 5, accuracy: 5, location: 5, value: 5 },
        });
        toast({ title: "Review submitted", description: "Thank you for your review!" });
      } else {
        throw new Error(response.message || "Failed to submit review");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({ variant: "destructive", title: "Review failed", description: error.message || "Failed to submit review" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display font-semibold">Reviews</h3>
        {canReview && user && (
          <Button
            onClick={() => setShowReviewForm(true)}
            variant="outline"
            size="sm"
          >
            <MessageSquare className="h-4 w-4" />
            Write a review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-secondary/50 rounded-2xl p-6 animate-fade-in">
          <h4 className="font-display font-semibold mb-4">Share your experience</h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <Label>Overall Rating</Label>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-6 w-6 ${i < newReview.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
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
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                placeholder="Share your experience..."
                rows={4}
                required
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit review"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-5">
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => {
            const guestName = review.guest?.name || "Guest";
            const guestAvatar =
              review.guest?.avatar ||
              "https://img.freepik.com/premium-photo/memoji-emoji-handsome-smiling-man-white-background_826801-6987.jpg?semt=ais_hybrid&w=740&q=80";

            return (
              <div key={review.id} className="pb-5 border-b border-border last:border-0">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary shrink-0">
                    <img src={guestAvatar} alt={guestName} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-medium text-sm">{guestName}</h4>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(review.createdAt), "MMMM yyyy")}
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="Be the first to review this place!"
          />
        )}
      </div>
    </div>
  );
}
