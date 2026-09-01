/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listingsAPI } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

interface AvailabilityCheckerProps {
  listingId: string;
  onAvailabilityCheck: (available: boolean, startDate: Date, endDate: Date) => void;
}

export default function AvailabilityChecker({ listingId, onAvailabilityCheck }: AvailabilityCheckerProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const handleCheckAvailability = async () => {
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Dates required",
        description: "Please select both check-in and check-out dates",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        variant: "destructive",
        title: "Invalid dates",
        description: "Check-out date must be after check-in date",
      });
      return;
    }

    setIsChecking(true);

    try {
      const response = await listingsAPI.checkAvailability(
        listingId,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      if (response.success) {
        const available = response.data?.available ?? false;
        onAvailabilityCheck(available, startDate, endDate);

        toast({
          title: available ? "Available!" : "Not available",
          variant: available ? "default" : "destructive",
          description: available
            ? "These dates are available for booking"
            : "These dates are already booked or unavailable",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Check failed",
        description: error.message || "Failed to check availability",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Check-in</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {startDate ? format(startDate, "MMM d") : "Add date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block">Check-out</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-11",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {endDate ? format(endDate, "MMM d") : "Add date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => date < new Date() || (startDate && date <= startDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Button
        onClick={handleCheckAvailability}
        disabled={isChecking || !startDate || !endDate}
        variant="outline"
        className="w-full"
      >
        {isChecking ? "Checking..." : "Check availability"}
      </Button>
    </div>
  );
}
