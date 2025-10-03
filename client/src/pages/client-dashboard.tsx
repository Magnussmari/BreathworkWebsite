import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Calendar as CalendarIcon, Clock, User, MapPin, Phone, Mail, CreditCard, X, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [bookingToReschedule, setBookingToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();

  const { data: bookings, isLoading: bookingsLoading, error } = useQuery({
    queryKey: ['/api/bookings'],
    retry: false,
  });

  // Handle unauthorized error
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("DELETE", `/api/bookings/${bookingId}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      const message = data.nextWaitlistUser 
        ? `Booking cancelled. ${data.nextWaitlistUser.name} (next on waitlist) will be notified.`
        : "Your booking has been cancelled successfully.";
      toast({
        title: "Booking Cancelled",
        description: message,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Available time slots for rescheduling
  const { data: availableSlots } = useQuery({
    queryKey: ['/api/time-slots', bookingToReschedule?.services.id, rescheduleDate?.toISOString()],
    queryFn: async () => {
      if (!bookingToReschedule || !rescheduleDate) return [];
      
      const startDate = new Date(rescheduleDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(rescheduleDate);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `/api/time-slots?serviceId=${bookingToReschedule.services.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!(bookingToReschedule && rescheduleDate),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ bookingId, newTimeSlotId }: { bookingId: string; newTimeSlotId: string }) => {
      await apiRequest("PATCH", `/api/bookings/${bookingId}`, { newTimeSlotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Rescheduled",
        description: "Your booking has been rescheduled successfully.",
      });
      setRescheduleDialogOpen(false);
      setBookingToReschedule(null);
      setRescheduleDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "Reschedule Failed",
        description: error.message || "Failed to reschedule booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (bookingsLoading) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted h-8 w-64 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted h-48 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  
  const upcomingBookings = bookings?.filter((booking: any) => {
    const timeSlot = booking?.time_slots || booking?.timeSlots;
    if (!timeSlot?.start_time && !timeSlot?.startTime) return false;
    const startTime = new Date(timeSlot.start_time || timeSlot.startTime);
    const isUpcoming = startTime > now && booking.bookings.status !== 'cancelled';
    return isUpcoming;
  }) || [];

  const pastBookings = bookings?.filter((booking: any) => {
    const timeSlot = booking?.time_slots || booking?.timeSlots;
    if (!timeSlot?.start_time && !timeSlot?.startTime) return false;
    const startTime = new Date(timeSlot.start_time || timeSlot.startTime);
    return (startTime <= now || booking.bookings.status === 'completed');
  }) || [];

  const cancelledBookings = bookings?.filter((booking: any) => 
    booking?.bookings?.status === 'cancelled'
  ) || [];

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">Completed</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'pending':
        return <Badge variant="destructive">Payment Due</Badge>;
      case 'refunded':
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const canCancelBooking = (booking: any) => {
    const timeSlot = booking?.time_slots || booking?.timeSlots;
    const startTime = timeSlot?.start_time || timeSlot?.startTime;
    
    if (!startTime || !booking?.bookings?.status) {
      return false;
    }
    
    const sessionTime = new Date(startTime);
    const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return (
      booking.bookings.status !== 'cancelled' && 
      booking.bookings.status !== 'completed' && 
      hoursUntilSession > 24 // Can cancel up to 24 hours before
    );
  };

  const BookingCard = ({ booking, showCancelButton = false }: { booking: any; showCancelButton?: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-booking-${booking.bookings.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{booking.services.name}</CardTitle>
            <div className="flex gap-2">
              {getStatusBadge(booking.bookings.status)}
              {getPaymentBadge(booking.bookings.paymentStatus)}
            </div>
          </div>
          {showCancelButton && canCancelBooking(booking) && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setBookingToReschedule(booking);
                  setRescheduleDialogOpen(true);
                }}
                data-testid={`button-reschedule-${booking.bookings.id}`}
              >
                <CalendarClock className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid={`button-cancel-${booking.bookings.id}`}>
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelBookingMutation.mutate(booking.bookings.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {(() => {
              const timeSlot = booking.time_slots || booking.timeSlots;
              const startTime = timeSlot?.start_time || timeSlot?.startTime;
              return format(new Date(startTime), 'EEEE, MMMM d, yyyy');
            })()}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {(() => {
              const timeSlot = booking.time_slots || booking.timeSlots;
              const startTime = timeSlot?.start_time || timeSlot?.startTime;
              const endTime = timeSlot?.end_time || timeSlot?.endTime;
              return `${format(new Date(startTime), 'h:mm a')} - ${format(new Date(endTime), 'h:mm a')}`;
            })()}
          </div>
          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            {(() => {
              const instructor = booking.instructors;
              const instructorUser = instructor?.users || instructor?.user;
              return `${instructorUser?.firstName || instructorUser?.first_name} ${instructorUser?.lastName || instructorUser?.last_name}`;
            })()}
          </div>
          <div className="flex items-center text-muted-foreground">
            <CreditCard className="h-4 w-4 mr-2" />
            {booking.services.price} ISK
          </div>
          
          {booking.bookings.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">{booking.bookings.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2" data-testid="dashboard-title">
              My Bookings
            </h1>
            <p className="text-muted-foreground" data-testid="dashboard-description">
              Manage your breathwork sessions and view your booking history
            </p>
          </div>
          <Button asChild data-testid="button-book-session">
            <Link href="/booking">Book New Session</Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground" data-testid="stat-total">
                {bookings?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary" data-testid="stat-upcoming">
                {upcomingBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                {pastBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive" data-testid="stat-cancelled">
                {cancelledBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-upcoming-title">
                    No Upcoming Sessions
                  </h3>
                  <p className="text-muted-foreground mb-4" data-testid="no-upcoming-description">
                    You don't have any upcoming breathwork sessions. Book one now!
                  </p>
                  <Button asChild data-testid="button-book-first">
                    <Link href="/booking">Book Your First Session</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} showCancelButton />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-past-title">
                    No Past Sessions
                  </h3>
                  <p className="text-muted-foreground" data-testid="no-past-description">
                    Your completed sessions will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-6">
            {cancelledBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <X className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-cancelled-title">
                    No Cancelled Sessions
                  </h3>
                  <p className="text-muted-foreground" data-testid="no-cancelled-description">
                    You haven't cancelled any sessions.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cancelledBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Contact Information */}
        <Card className="mt-12 bg-gradient-to-r from-primary/5 to-accent/5 border-none">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-center" data-testid="contact-title">
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div data-testid="contact-phone">
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-1">Call Us</h3>
                <p className="text-muted-foreground">+354 555 1234</p>
              </div>
              
              <div data-testid="contact-email">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-1">Email Us</h3>
                <p className="text-muted-foreground">hello@nordicbreath.is</p>
              </div>
              
              <div data-testid="contact-location">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-1">Visit Us</h3>
                <p className="text-muted-foreground">Reykjavík, Iceland</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          
          {bookingToReschedule && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Current Booking</h4>
                <p className="text-sm">{bookingToReschedule.services.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const timeSlot = bookingToReschedule.time_slots || bookingToReschedule.timeSlots;
                    const startTime = timeSlot?.start_time || timeSlot?.startTime;
                    return format(new Date(startTime), 'EEEE, MMMM d, yyyy • h:mm a');
                  })()}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Select New Date</h4>
                <Calendar
                  mode="single"
                  selected={rescheduleDate}
                  onSelect={setRescheduleDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                  data-testid="calendar-reschedule"
                />
              </div>

              {rescheduleDate && (
                <div>
                  <h4 className="font-semibold mb-3">Available Time Slots</h4>
                  {availableSlots && availableSlots.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableSlots.map((slot: any) => {
                        const timeSlot = slot.time_slots || slot.timeSlots;
                        const slotId = timeSlot?.id;
                        const startTime = timeSlot?.start_time || timeSlot?.startTime;
                        const endTime = timeSlot?.end_time || timeSlot?.endTime;
                        const instructor = slot.instructors;
                        const instructorUser = instructor?.users || instructor?.user;
                        
                        return (
                          <button
                            key={slotId}
                            onClick={() => 
                              rescheduleMutation.mutate({
                                bookingId: bookingToReschedule.bookings.id,
                                newTimeSlotId: slotId,
                              })
                            }
                            disabled={rescheduleMutation.isPending}
                            className="w-full p-3 border rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
                            data-testid={`button-slot-${slotId}`}
                          >
                            <div className="font-medium">
                              {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              with {instructorUser?.firstName || instructorUser?.first_name} {instructorUser?.lastName || instructorUser?.last_name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm" data-testid="no-slots-available">
                      No available time slots for this date.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
