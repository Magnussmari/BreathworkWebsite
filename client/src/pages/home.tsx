import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import ServiceCard from "@/components/service-card";
import InstructorCard from "@/components/instructor-card";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: instructors, isLoading: instructorsLoading } = useQuery({
    queryKey: ['/api/instructors'],
  });

  const { data: userBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
  });

  const upcomingBookings = (userBookings && Array.isArray(userBookings)) ? userBookings.filter((booking: any) => {
    const timeSlot = booking?.time_slots || booking?.timeSlots;
    const startTime = timeSlot?.start_time || timeSlot?.startTime;
    return startTime && new Date(startTime) > new Date() && booking.bookings.status !== 'cancelled';
  }).slice(0, 3) : [];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4" data-testid="welcome-title">
              Welcome back, {user?.firstName || 'friend'}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ready for your next transformative breathwork experience?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" data-testid="button-book-session">
                <Link href="/booking">Book New Session</Link>
              </Button>
              <Button asChild variant="outline" size="lg" data-testid="button-view-dashboard">
                <Link href="/dashboard">View My Bookings</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="upcoming-title">
              Your Upcoming Sessions
            </h2>
            <Button asChild variant="ghost" data-testid="button-view-all-bookings">
              <Link href="/dashboard">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upcomingBookings.map((booking: any) => (
              <Card key={booking.bookings.id} className="hover:shadow-lg transition-shadow" data-testid={`card-booking-${booking.bookings.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{booking.services.name}</CardTitle>
                    <Badge variant="secondary">
                      {booking.bookings.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {(() => {
                        const timeSlot = booking.time_slots || booking.timeSlots;
                        const startTime = timeSlot?.start_time || timeSlot?.startTime;
                        return new Date(startTime).toLocaleDateString();
                      })()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {(() => {
                        const timeSlot = booking.time_slots || booking.timeSlots;
                        const startTime = timeSlot?.start_time || timeSlot?.startTime;
                        return new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      })()}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {(() => {
                        const instructor = booking.instructors;
                        const instructorUser = instructor?.users || instructor?.user;
                        return `${instructorUser?.firstName || instructorUser?.first_name} ${instructorUser?.lastName || instructorUser?.last_name}`;
                      })()}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{booking.services.price} ISK</span>
                      <Badge variant={booking.bookings.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                        {booking.bookings.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Popular Services */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-4" data-testid="services-title">
            Popular Sessions
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="services-description">
            Discover the breathwork experience that's right for you
          </p>
        </div>

        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-64"></div>
              </div>
            ))}
          </div>
        ) : services && Array.isArray(services) && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.slice(0, 3).map((service: any) => (
              <ServiceCard
                key={service.id}
                service={service}
                showBookButton={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No services available at this time.</p>
          </div>
        )}

        <div className="text-center mt-8">
          <Button asChild variant="outline" data-testid="button-view-all-services">
            <Link href="/services">
              View All Services <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Meet Our Instructors */}
      <div className="bg-card py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground mb-4" data-testid="instructors-title">
              Meet Our Instructors
            </h2>
            <p className="text-lg text-muted-foreground" data-testid="instructors-description">
              Certified breathwork facilitators dedicated to your transformation
            </p>
          </div>

          {instructorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse text-center">
                  <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="bg-muted h-6 w-32 mx-auto mb-2 rounded"></div>
                  <div className="bg-muted h-4 w-24 mx-auto rounded"></div>
                </div>
              ))}
            </div>
          ) : instructors && Array.isArray(instructors) && instructors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {instructors.slice(0, 3).map((instructor: any) => (
                <InstructorCard
                  key={instructor.instructors.id}
                  instructor={instructor}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No instructors available at this time.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button asChild variant="ghost" data-testid="button-view-all-instructors">
              <Link href="/instructors">
                View All Instructors <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-primary to-accent py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4" data-testid="cta-title">
            Ready for Your Next Session?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto" data-testid="cta-description">
            Continue your breathwork journey with us. Book your next transformative session today.
          </p>
          <Button asChild size="lg" variant="secondary" data-testid="button-book-now-cta">
            <Link href="/booking">Book Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
