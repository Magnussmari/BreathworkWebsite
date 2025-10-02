import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import BookingFlow from "@/pages/booking-flow";
import AdminDashboard from "@/pages/admin-dashboard";
import StaffDashboard from "@/pages/staff-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import Services from "@/pages/services";
import Instructors from "@/pages/instructors";
import Checkout from "@/pages/checkout";
import Navbar from "@/components/navbar";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && <Navbar />}
      
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/booking" component={BookingFlow} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/services" component={Services} />
            <Route path="/instructors" component={Instructors} />
            <Route path="/dashboard" component={ClientDashboard} />
            {user?.role === 'staff' && (
              <Route path="/staff" component={StaffDashboard} />
            )}
            {user?.role === 'admin' && (
              <Route path="/admin" component={AdminDashboard} />
            )}
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
