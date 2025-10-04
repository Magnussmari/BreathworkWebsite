import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import ClassesLanding from "@/pages/classes-landing";
import ClassDetail from "@/pages/class-detail";
import RegistrationSuccess from "@/pages/registration-success";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin-dashboard";
import ClientDashboard from "@/pages/client-dashboard";
import About from "@/pages/about";
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
        <Route path="/" component={ClassesLanding} />
        <Route path="/about" component={About} />
        <Route path="/class/:id" component={ClassDetail} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        {isAuthenticated && (
          <>
            <Route path="/dashboard" component={ClientDashboard} />
            <Route path="/registration/:id" component={RegistrationSuccess} />
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
