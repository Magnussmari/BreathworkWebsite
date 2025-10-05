import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Clock, User, CreditCard, Building2, Hash } from "lucide-react";
import { format } from "date-fns";

export default function Checkout() {
  const [location] = useLocation();
  const { toast } = useToast();

  // Get booking ID from URL params
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const bookingId = urlParams.get('bookingId');

  const { data: booking, isLoading: bookingLoading, error } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    enabled: !!bookingId,
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
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (!bookingId) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground mb-4" data-testid="error-title">
                No Booking Found
              </h1>
              <p className="text-muted-foreground mb-6" data-testid="error-description">
                We couldn't find a booking to process payment for.
              </p>
              <Button asChild data-testid="button-go-dashboard">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bookingLoading) {
    return (
      <div className="min-h-screen pt-16 py-12 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="font-serif text-2xl font-bold text-foreground mb-4" data-testid="booking-not-found-title">
                Booking Not Found
              </h1>
              <p className="text-muted-foreground mb-6" data-testid="booking-not-found-description">
                The booking you're trying to pay for could not be found.
              </p>
              <Button asChild data-testid="button-go-dashboard">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (booking.bookings.paymentStatus === 'paid') {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-bold text-foreground mb-4" data-testid="already-paid-title">
                Payment Already Completed
              </h1>
              <p className="text-muted-foreground mb-6" data-testid="already-paid-description">
                This booking has already been paid for. Thank you!
              </p>
              <Button asChild data-testid="button-go-dashboard">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="font-serif text-2xl" data-testid="booking-summary-title">
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2" data-testid="service-name">
                    {booking.services.name}
                  </h3>
                  <Badge variant="secondary">{booking.services.category}</Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-3" />
                    <span data-testid="booking-date">
                      {format(new Date(booking.timeSlots.startTime), 'EEEE, MMMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-3" />
                    <span data-testid="booking-time">
                      {format(new Date(booking.timeSlots.startTime), 'h:mm a')} - {format(new Date(booking.timeSlots.endTime), 'h:mm a')}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-3" />
                    <span data-testid="instructor-name">
                      {booking.instructors.users.firstName} {booking.instructors.users.lastName}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <CreditCard className="h-4 w-4 mr-3" />
                    <span data-testid="duration">
                      {booking.services.duration} minutes
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-muted-foreground mb-4">
                    {booking.services.description}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total:</span>
                    <span className="text-primary" data-testid="summary-total">
                      {booking.services.price} ISK
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bank Transfer Payment Instructions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl" data-testid="payment-title">
                  Payment Instructions
                </CardTitle>
                <p className="text-muted-foreground">
                  Complete your booking by transferring the amount to our bank account.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-start">
                      <Building2 className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                        <p className="text-base font-semibold" data-testid="bank-name">Landsbankinn</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Hash className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Account Number (Kennitala)</p>
                        <p className="text-base font-semibold font-mono" data-testid="account-number">0133-26-xxxxxx</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Hash className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">Reference Number</p>
                        <p className="text-base font-semibold font-mono" data-testid="reference-number">{booking.bookings.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold mb-4">
                      <span>Amount to Transfer:</span>
                      <span className="text-2xl text-primary" data-testid="total-amount">{booking.services.price} ISK</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <strong>Important:</strong> Please include the reference number in your transfer to ensure proper payment processing.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Once we receive your payment, you'll receive a confirmation email. This typically takes 1-2 business days.
                  </p>
                  <Button
                    asChild
                    className="w-full"
                    data-testid="button-dashboard"
                  >
                    <a href="/dashboard">Return to Dashboard</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5 border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure Bank Transfer
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Payment Confirmed via Email
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
