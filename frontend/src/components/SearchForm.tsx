
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SearchForm() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (location) params.append("location", location);
    if (date) params.append("date", format(date, "yyyy-MM-dd"));
    params.append("guests", guests.toString());
    
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white rounded-lg shadow-lg">
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Where are you going?"
          className="pl-10 w-full"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal w-full md:w-1/3",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>
      
      <div className="flex items-center gap-2 w-full md:w-1/6">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10"
          onClick={() => setGuests(Math.max(1, guests - 1))}
          disabled={guests <= 1}
        >
          -
        </Button>
        <span className="flex-1 text-center">
          {guests} {guests === 1 ? "Guest" : "Guests"}
        </span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10"
          onClick={() => setGuests(guests + 1)}
        >
          +
        </Button>
      </div>
      
      <Button 
        type="submit" 
        className="w-full md:w-auto bg-gaun-green hover:bg-gaun-light-green"
      >
        Search
      </Button>
    </form>
  );
}
