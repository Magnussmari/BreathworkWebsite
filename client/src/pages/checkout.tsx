import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, CreditCard } from "lucide-react";
import { format } from "date-fns";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ booking }: { booking: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your booking! You'll receive a confirmation email shortly.",
      });
    }

    setIsProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl" data-testid="payment-title">
          Complete Your Payment
        </CardTitle>
        <p className="text-muted-foreground">
          Secure payment processing with Stripe. We accept all major cards and digital wallets.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span data-testid="total-amount">{booking.services.price} ISK</span>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={!stripe || isProcessing} 
            className="w-full"
            data-testid="button-pay"
          >
            {isProcessing ? 'Processing...' : `Pay ${booking.services.price} ISK`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  const createPaymentIntentMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error('No booking data');
      
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: parseFloat(booking.services.price),
        currency: "isk",
        metadata: {
          bookingId: booking.bookings.id,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
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
        title: "Payment Setup Failed",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (booking && booking.bookings.paymentStatus !== 'paid') {
      createPaymentIntentMutation.mutate();
    }
  }, [booking]);

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

  if (!clientSecret) {
    return (
      <div className="min-h-screen pt-16 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" aria-label="Loading"/>
          <p className="text-muted-foreground">Setting up payment...</p>
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

          {/* Payment Form */}
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm booking={booking} />
            </Elements>

            {/* Security Information */}
            <Card className="mt-6 bg-gradient-to-r from-primary/5 to-accent/5 border-none">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secured by Stripe
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    SSL Encrypted
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
