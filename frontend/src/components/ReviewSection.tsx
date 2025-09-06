import { useState, useEffect } from "react";
import { reviewsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  guest: {
    name: string;
    avatar?: string;
  };
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
        console.warn('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingId) return;

    setIsSubmitting(true);
    
    try {
      const response = await reviewsAPI.createReview({
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
      }
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
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        }`}
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
                      className={`w-6 h-6 ${
                        i < newReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                      }`}
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
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
                  {review.guest.avatar ? (
                    <img
                      src={review.guest.avatar}
                      alt={review.guest.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm font-medium">
                      {review.guest.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{review.guest.name}</h4>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(review.createdAt), "MMMM yyyy")}
                  </p>
                  <p className="text-sm">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No reviews yet. Be the first to review this place!
          </div>
        )}
      </div>
    </div>
  );
}