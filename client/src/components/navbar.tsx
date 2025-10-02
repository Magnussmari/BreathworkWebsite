import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, User, Settings, LogOut, Home, BookOpen, Users } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-50" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M8 12 Q12 8 16 12 Q12 16 8 12" strokeWidth="2" fill="none"/>
            </svg>
            <span className="font-serif text-xl font-bold text-foreground">Nordic Breath</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-home">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link href="/booking" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/booking') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-booking">
              <Calendar className="w-4 h-4" />
              <span>Book Session</span>
            </Link>
            <Link href="/services" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/services') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-services">
              <BookOpen className="w-4 h-4" />
              <span>Services</span>
            </Link>
            <Link href="/instructors" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/instructors') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-instructors">
              <Users className="w-4 h-4" />
              <span>Instructors</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <Button asChild variant="default" size="sm" data-testid="button-book-now">
              <Link href="/booking">Book Now</Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl} alt="Profile" />
                    <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount data-testid="user-menu-content">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user?.firstName && (
                      <p className="font-medium" data-testid="user-name">
                        {user.firstName} {user?.lastName}
                      </p>
                    )}
                    {user?.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground" data-testid="user-email">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild data-testid="menu-dashboard">
                  <Link href="/dashboard" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    My Bookings
                  </Link>
                </DropdownMenuItem>

                {user?.role === 'staff' && (
                  <DropdownMenuItem asChild data-testid="menu-staff">
                    <Link href="/staff" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Staff Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild data-testid="menu-admin">
                    <Link href="/admin" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild data-testid="menu-logout">
                  <a href="/api/logout" className="flex items-center text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
