import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, MapPin, Users, X, Sparkles, ArrowRight } from "lucide-react";
import type { Registration, Class, ClassTemplate } from "@shared/schema";

interface RegistrationWithClass extends Registration {
  class: Class & { template: ClassTemplate };
}

export default function ClientDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: registrations, isLoading } = useQuery<RegistrationWithClass[]>({
    queryKey: ['/api/registrations/my'],
  });

  const cancelMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await fetch(`/api/registrations/${registrationId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to cancel');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/registrations/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/upcoming'] });
      toast({
        title: "Registration Cancelled",
        description: "Your spot has been freed up for others.",
      });
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = registrations?.filter(r =>
    new Date(r.class.scheduledDate) > now && r.status !== 'cancelled'
  ) || [];
  const past = registrations?.filter(r =>
    new Date(r.class.scheduledDate) <= now || r.status === 'cancelled'
  ) || [];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('is-IS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('is-IS', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const canCancel = (registration: RegistrationWithClass) => {
    const hoursUntil = (new Date(registration.class.scheduledDate).getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntil > 24 && registration.status !== 'cancelled';
  };

  const RegistrationCard = ({ registration }: { registration: RegistrationWithClass }) => {
    const classDate = new Date(registration.class.scheduledDate);
    const isUpcoming = classDate > now && registration.status !== 'cancelled';

    return (
      <Card className={`group hover:shadow-lg transition-all ${isUpcoming ? 'border-primary/20' : 'opacity-75'}`}>
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-serif mb-2 line-clamp-1">
                {registration.class.template.name}
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant={registration.status === 'confirmed' ? 'default' : registration.status === 'cancelled' ? 'destructive' : 'secondary'}>
                  {registration.status === 'confirmed' ? '✓ Confirmed' : registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                </Badge>
                <Badge variant={registration.paymentStatus === 'paid' ? 'default' : 'outline'} className="bg-amber-500/10 text-amber-700 border-amber-200">
                  {registration.paymentStatus === 'paid' ? 'Paid' : 'Pay at door'}
                </Badge>
              </div>
            </div>

            {isUpcoming && canCancel(registration) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your spot for "{registration.class.template.name}"?
                      This will free up your spot for other participants.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Spot</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelMutation.mutate(registration.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Spot
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Date</p>
                <p className="text-muted-foreground line-clamp-2">{formatDate(classDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Time</p>
                <p className="text-muted-foreground">{formatTime(classDate)}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Location</p>
                <p className="text-muted-foreground line-clamp-2">{registration.class.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Capacity</p>
                <p className="text-muted-foreground">
                  {registration.class.currentBookings}/{registration.class.maxCapacity} spots
                </p>
              </div>
            </div>
          </div>

          {registration.notes && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground italic">Note: {registration.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Header */}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
            My Breathwork Journey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Track your sessions, manage your bookings, and continue your transformation
          </p>
          <Button
            size="lg"
            onClick={() => setLocation("/")}
            className="group"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Explore Classes
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-primary mb-2">{upcoming.length}</div>
              <div className="text-sm font-medium text-muted-foreground">Upcoming Sessions</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-green-600 mb-2">{past.length}</div>
              <div className="text-sm font-medium text-muted-foreground">Completed Sessions</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="text-4xl font-bold text-amber-600 mb-2">{registrations?.length || 0}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Registrations</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-foreground">Upcoming Sessions</h2>
            {upcoming.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {upcoming.length} active
              </Badge>
            )}
          </div>

          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Upcoming Sessions</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Ready to transform? Book your next breathwork session and continue your journey.
                </p>
                <Button onClick={() => setLocation("/")}>
                  Browse Available Classes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcoming.map((registration) => (
                <RegistrationCard key={registration.id} registration={registration} />
              ))}
            </div>
          )}
        </div>

        {/* Past Sessions */}
        {past.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Past Sessions</h2>
              <Badge variant="outline" className="text-sm">
                {past.length} completed
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {past.map((registration) => (
                <RegistrationCard key={registration.id} registration={registration} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
