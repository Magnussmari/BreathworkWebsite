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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, User, Settings, LogOut, Home, BookOpen, Users } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Útskráður",
        description: "Þú hefur verið skráður út.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Villa",
        description: "Útskráning mistókst. Vinsamlegast reyndu aftur.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
            <span className="font-serif text-xl font-bold text-foreground">Breathwork</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-home">
              <Home className="w-4 h-4" />
              <span>Heim</span>
            </Link>
            <Link href="/about" className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${isActive('/about') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid="nav-about">
              <BookOpen className="w-4 h-4" />
              <span>Um okkur</span>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button asChild variant="default" size="sm" data-testid="button-book-now">
                  <Link href="/">Bóka núna</Link>
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
                    Bókanir mínar
                  </Link>
                </DropdownMenuItem>

                {user?.role === 'staff' && (
                  <DropdownMenuItem asChild data-testid="menu-staff">
                    <Link href="/staff" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      Starfsmannasvæði
                    </Link>
                  </DropdownMenuItem>
                )}

                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild data-testid="menu-admin">
                    <Link href="/admin" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Stjórnborð
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center text-destructive cursor-pointer"
                  data-testid="menu-logout"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Skrái út..." : "Skrá út"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Skrá inn</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/register">Búa til aðgang</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
