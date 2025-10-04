import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Class, ClassTemplate } from "@shared/schema";

interface ClassWithTemplate extends Class {
  template: ClassTemplate;
}

export default function ClassDetail() {
  const [, params] = useRoute("/class/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const { data: classItem, isLoading } = useQuery<ClassWithTemplate>({
    queryKey: [`/api/classes/${params?.id}`],
    enabled: !!params?.id,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!classItem) throw new Error("No class selected");

      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          classId: classItem.id,
          paymentAmount: actualPrice,
          paymentStatus: "pending",
          status: "pending",
          paymentMethod: "bank_transfer",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (registration) => {
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations/my"] });
      // Redirect to success page with payment instructions
      setLocation(`/registration/${registration.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Bókun mistókst",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Tími fannst ekki</h2>
            <p className="text-muted-foreground mb-6">Þessi tími er ekki til eða hefur verið fjarlægður.</p>
            <Button onClick={() => setLocation("/")}>Til baka á forsíðu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const spotsLeft = classItem.maxCapacity - classItem.currentBookings;
  const isFull = spotsLeft === 0;
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;
  const actualPrice = classItem.customPrice || classItem.template.price;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Til baka í tíma
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="relative h-64 overflow-hidden rounded-t-lg">
                <img
                  src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400"
                  alt="9D Breathwork"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  {isFull ? (
                    <Badge variant="destructive" className="text-lg px-4 py-2">Uppselt</Badge>
                  ) : isAlmostFull ? (
                    <Badge variant="secondary" className="text-lg px-4 py-2 bg-orange-500 text-white">
                      Aðeins {spotsLeft} pláss eftir!
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {spotsLeft} pláss laus
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-3xl font-serif">{classItem.template.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Dagsetning</p>
                      <p className="text-muted-foreground">{formatDate(classItem.scheduledDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Tími og lengd</p>
                      <p className="text-muted-foreground">{formatTime(classItem.scheduledDate)} · {classItem.template.duration} min</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Staðsetning</p>
                      <p className="text-muted-foreground">{classItem.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold">Fjöldi</p>
                      <p className="text-muted-foreground">{classItem.currentBookings} / {classItem.maxCapacity} registered</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold text-xl mb-3">Um þennan tíma</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                    {classItem.template.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl">Bókaðu pláss</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-muted-foreground">Verð</span>
                    <span className="text-3xl font-bold">{actualPrice.toLocaleString('is-IS')} ISK</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Greitt við komu</p>
                </div>

                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => setLocation("/login")}
                    >
                      Skráðu þig inn til að bóka
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      eða <button onClick={() => setLocation("/register")} className="text-primary hover:underline">búðu til aðgang</button>
                    </p>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={isFull || registerMutation.isPending}
                    onClick={() => registerMutation.mutate()}
                  >
                    {registerMutation.isPending ? (
                      "Bóka..."
                    ) : isFull ? (
                      "Tíminn er fullbókaður"
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Bóka pláss
                      </>
                    )}
                  </Button>
                )}

                <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
                  <p>✓ Staðfesting strax</p>
                  <p>✓ Greitt við komu (reiðufé eða kort)</p>
                  <p>✓ Ókeypis afbókun allt að 24 klst. fyrir</p>
                  <p>✓ Staðfestingarpóstur sendur</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
