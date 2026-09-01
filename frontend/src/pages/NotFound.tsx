import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Hop as Home, Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-7xl md:text-8xl font-display font-semibold tracking-tight text-primary/20 mb-2">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-3">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <Button size="lg">
              <Home className="h-4 w-4" />
              Back to home
            </Button>
          </Link>
          <Link to="/listings">
            <Button variant="outline" size="lg">
              <Search className="h-4 w-4" />
              Browse stays
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
