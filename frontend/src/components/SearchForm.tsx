import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Search, MapPin, Users, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SearchForm() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (location) params.append("location", location);
    if (date) params.append("date", format(date, "yyyy-MM-dd"));
    params.append("guests", guests.toString());

    navigate(`/listings?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0 p-2 bg-white rounded-2xl shadow-xl md:shadow-2xl md:divide-x md:divide-border"
    >
      {/* Location */}
      <div className="relative flex-1 md:px-4">
        <label className="absolute top-2 left-10 md:left-4 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Location
        </label>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Where are you going?"
          className="border-0 shadow-none focus-visible:ring-0 pl-10 md:pl-10 pt-5 pb-1 h-14 text-sm font-medium bg-transparent"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Date */}
      <div className="relative flex-1 md:px-4">
        <label className="absolute top-2 left-10 md:left-6 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Check-in
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "w-full h-14 pl-10 md:pl-12 pr-3 text-left text-sm font-medium flex items-center pt-5 pb-1 rounded-lg hover:bg-secondary/50 transition-colors"
              )}
            >
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {date ? format(date, "MMM d, yyyy") : "Add dates"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Guests */}
      <div className="relative flex-1 md:px-4">
        <label className="absolute top-2 left-10 md:left-6 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Guests
        </label>
        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <div className="flex items-center justify-between h-14 pl-10 md:pl-12 pr-3 pt-5 pb-1">
          <span className="text-sm font-medium">
            {guests} {guests === 1 ? "Guest" : "Guests"}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Decrease guests"
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary disabled:opacity-40 transition-colors"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Increase guests"
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors"
              onClick={() => setGuests(guests + 1)}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="md:px-2">
        <Button
          type="submit"
          size="lg"
          className="w-full md:w-auto h-12 md:h-12 md:px-6"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
        </Button>
      </div>
    </form>
  );
}
