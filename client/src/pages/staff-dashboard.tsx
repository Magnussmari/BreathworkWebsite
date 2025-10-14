import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Phone, Mail, MapPin, Plus } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const { data: instructorProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['/api/instructors/profile'],
    queryFn: async () => {
      // Get instructor profile based on current user
      const response = await fetch('/api/instructors');
      if (!response.ok) throw new Error('Failed to fetch instructors');
      const instructors = await response.json();
      return instructors.find((instructor: any) => instructor.users.id === user?.id);
    },
    retry: false,
  });

  const { data: bookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['/api/bookings', 'staff'],
    retry: false,
  });

  const { data: availability, isLoading: availabilityLoading } = useQuery({
    queryKey: [`/api/availability/${instructorProfile?.instructors.id}`],
    enabled: !!instructorProfile?.instructors.id,
  });

  // Handle unauthorized errors
  useEffect(() => {
    const errors = [profileError, bookingsError].filter(Boolean);
    errors.forEach((error) => {
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
    });
  }, [profileError, bookingsError, toast]);

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      await apiRequest("PUT", `/api/bookings/${bookingId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', 'staff'] });
      toast({
        title: "Booking Updated",
        description: "The booking status has been updated successfully.",
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
        title: "Update Failed",
        description: "Failed to update booking status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (profileLoading || bookingsLoading) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted h-8 w-64 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted h-24 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!instructorProfile) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground mb-4" data-testid="no-instructor-title">
                Instructor Profile Not Found
              </h1>
              <p className="text-muted-foreground mb-6" data-testid="no-instructor-description">
                You don't appear to have an instructor profile. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const now = new Date();
  const todayBookings = (bookings && Array.isArray(bookings)) ? bookings.filter((booking: any) => {
    const bookingDate = new Date(booking.timeSlots.startTime);
    return (
      bookingDate.toDateString() === now.toDateString() &&
      booking.bookings.status !== 'cancelled'
    );
  }) : [];

  const upcomingBookings = (bookings && Array.isArray(bookings)) ? bookings.filter((booking: any) => {
    const bookingDate = new Date(booking.timeSlots.startTime);
    return (
      bookingDate > now &&
      booking.bookings.status !== 'cancelled' &&
      booking.bookings.status !== 'completed'
    );
  }) : [];

  const pendingBookings = (bookings && Array.isArray(bookings)) ? bookings.filter((booking: any) =>
    booking.bookings.status === 'pending'
  ) : [];

  const completedBookings = (bookings && Array.isArray(bookings)) ? bookings.filter((booking: any) =>
    booking.bookings.status === 'completed'
  ) : [];

  const getStatusBadge = (status: string) => {
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

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`card-booking-${booking.bookings.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-2">{booking.services.name}</CardTitle>
            {getStatusBadge(booking.bookings.status)}
          </div>
          {booking.bookings.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateBookingMutation.mutate({
                  bookingId: booking.bookings.id,
                  status: 'confirmed'
                })}
                data-testid={`button-confirm-${booking.bookings.id}`}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(booking.timeSlots.startTime), 'EEEE, MMMM d, yyyy')}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
            {format(new Date(booking.timeSlots.startTime), 'h:mm a')} - {format(new Date(booking.timeSlots.endTime), 'h:mm a')}
          </div>
          <div className="flex items-center text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            {booking.users.firstName} {booking.users.lastName}
          </div>
          {booking.users.email && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <a href={`mailto:${booking.users.email}`} className="hover:text-primary">
                {booking.users.email}
              </a>
            </div>
          )}
          
          {booking.bookings.customFormData?.experienceLevel && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">Experience Level:</p>
              <Badge variant="outline" className="text-xs">
                {booking.bookings.customFormData.experienceLevel}
              </Badge>
            </div>
          )}
          
          {booking.bookings.customFormData?.healthConditions && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Health Notes:</p>
              <p className="text-xs text-muted-foreground">
                {booking.bookings.customFormData.healthConditions}
              </p>
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
              Staff Dashboard
            </h1>
            <p className="text-muted-foreground" data-testid="dashboard-subtitle">
              Welcome back, {instructorProfile.users.firstName}! Manage your schedule and bookings.
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground" data-testid="stat-today">
                {todayBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Today's Sessions</div>
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
              <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending">
                {pendingBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending Approval</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600" data-testid="stat-completed">
                {completedBookings.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-2/3">
            <TabsTrigger value="today" data-testid="tab-today">
              Today ({todayBookings.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({pendingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            {todayBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-today-title">
                    No Sessions Today
                  </h3>
                  <p className="text-muted-foreground" data-testid="no-today-description">
                    You don't have any sessions scheduled for today.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todayBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-upcoming-title">
                    No Upcoming Sessions
                  </h3>
                  <p className="text-muted-foreground" data-testid="no-upcoming-description">
                    You don't have any upcoming sessions scheduled.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2" data-testid="no-pending-title">
                    No Pending Bookings
                  </h3>
                  <p className="text-muted-foreground" data-testid="no-pending-description">
                    All your bookings are confirmed or completed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingBookings.map((booking: any) => (
                  <BookingCard key={booking.bookings.id} booking={booking} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl" data-testid="profile-title">
                    Instructor Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center mb-6">
                    <img
                      src={instructorProfile.users.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                      alt={`${instructorProfile.users.firstName} ${instructorProfile.users.lastName}`}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      data-testid="profile-image"
                    />
                    <h3 className="font-semibold text-xl text-foreground" data-testid="profile-name">
                      {instructorProfile.users.firstName} {instructorProfile.users.lastName}
                    </h3>
                    <p className="text-muted-foreground" data-testid="profile-email">
                      {instructorProfile.users.email}
                    </p>
                  </div>

                  {instructorProfile.instructors.bio && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Bio</h4>
                      <p className="text-muted-foreground text-sm" data-testid="profile-bio">
                        {instructorProfile.instructors.bio}
                      </p>
                    </div>
                  )}

                  {instructorProfile.instructors.specializations && instructorProfile.instructors.specializations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2" data-testid="profile-specializations">
                        {instructorProfile.instructors.specializations.map((spec: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {instructorProfile.instructors.certifications && instructorProfile.instructors.certifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2" data-testid="profile-certifications">
                        {instructorProfile.instructors.certifications.map((cert: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl" data-testid="availability-title">
                    Weekly Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availabilityLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="animate-pulse bg-muted h-8 rounded"></div>
                      ))}
                    </div>
                  ) : availability && Array.isArray(availability) && availability.length > 0 ? (
                    <div className="space-y-3" data-testid="availability-list">
                      {availability.map((slot: any) => {
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return (
                          <div key={slot.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="font-medium">
                              {dayNames[slot.dayOfWeek]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground" data-testid="no-availability">
                        No availability set. Contact admin to set up your schedule.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
