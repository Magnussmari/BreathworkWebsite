import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle, Timer, AlertCircle } from "lucide-react";
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

  const [step, setStep] = useState<"initial" | "confirming" | "success">("initial");
  const [hasConfirmedTransfer, setHasConfirmedTransfer] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "pay_on_arrival">("bank_transfer");

  const { data: classItem, isLoading } = useQuery<ClassWithTemplate>({
    queryKey: [`/api/classes/${params?.id}`],
    enabled: !!params?.id,
  });

  // Timer countdown
  useEffect(() => {
    if (step === "confirming" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up, cancel reservation
            cancelReservationMutation.mutate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Create reservation (holds spot for 10 minutes)
  const createReservationMutation = useMutation({
    mutationFn: async () => {
      if (!classItem) throw new Error("No class selected");

      const response = await fetch("/api/registrations/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          classId: classItem.id,
          paymentAmount: actualPrice,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(error.message || "Reservation failed");
      }

      const text = await response.text();
      if (!text) {
        throw new Error("Engin svar frá bakenda");
      }

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("JSON parse error:", e);
        console.error("Response text:", text);
        throw new Error(`Ógilt svar frá bakenda: ${text.substring(0, 100)}`);
      }
    },
    onSuccess: (reservation) => {
      setReservationId(reservation.id);
      setStep("confirming");
      setTimeRemaining(600); // Reset to 10 minutes
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${params?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bókun mistókst",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Step 2: Confirm after user checks transfer box
  const confirmRegistrationMutation = useMutation({
    mutationFn: async () => {
      if (!reservationId) throw new Error("No reservation");

      const response = await fetch(`/api/registrations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "confirm" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Confirmation failed");
      }

      return response.json();
    },
    onSuccess: () => {
      setStep("success");
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${params?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Staðfesting mistókst",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel reservation if user leaves or time runs out
  const cancelReservationMutation = useMutation({
    mutationFn: async () => {
      if (!reservationId) return;

      await fetch(`/api/registrations/${reservationId}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });
    },
    onSuccess: () => {
      setStep("initial");
      setReservationId(null);
      setHasConfirmedTransfer(false);
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${params?.id}`] });
      toast({
        title: "Bókun felld niður",
        description: "Plássið þitt hefur verið losað",
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

  const formatTimeOfDay = (date: Date) => {
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
                      <p className="text-muted-foreground">{formatTimeOfDay(classItem.scheduledDate)} · {classItem.template.duration} min</p>
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
                      <p className="text-muted-foreground">{classItem.currentBookings} / {classItem.maxCapacity} skráðir</p>
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
                    <span className="text-3xl font-bold">{actualPrice.toLocaleString('is-IS')} kr.</span>
                  </div>
                </div>

                {step === "initial" && (
                  <>
                    {/* Payment Method Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Greiðslumáti</Label>
                      <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "bank_transfer" | "pay_on_arrival")}>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent" onClick={() => setPaymentMethod("bank_transfer")}>
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                            <span className="font-medium">Millifærsla</span>
                            <p className="text-sm text-muted-foreground">Greiðslufrestur 24 klst.</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent" onClick={() => setPaymentMethod("pay_on_arrival")}>
                          <RadioGroupItem value="pay_on_arrival" id="pay_on_arrival" />
                          <Label htmlFor="pay_on_arrival" className="flex-1 cursor-pointer">
                            <span className="font-medium">Borga við komu</span>
                            <p className="text-sm text-muted-foreground">Greiðsla í stað</p>
                          </Label>
                        </div>
                      </RadioGroup>
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
                        disabled={isFull || createReservationMutation.isPending}
                        onClick={() => createReservationMutation.mutate()}
                      >
                        {createReservationMutation.isPending ? (
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
                      <p>✓ Pláss frátekið strax</p>
                      {paymentMethod === "bank_transfer" ? (
                        <>
                          <p>✓ Greiðsluupplýsingar í staðfestingarpósti</p>
                          <p>✓ Greiðslufrestur 24 klst.</p>
                        </>
                      ) : (
                        <p>✓ Borgaðu þegar þú mætir í tímanum</p>
                      )}
                      <p>✓ Ókeypis afbókun allt að 24 klst. fyrir</p>
                    </div>
                  </>
                )}

                {step === "confirming" && (
                  <div className="space-y-4">
                    {/* Timer */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Timer className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold text-orange-900">Pláss frátekið</span>
                        </div>
                        <span className="text-2xl font-bold text-orange-600 font-mono">
                          {formatTime(timeRemaining)}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700">
                        {paymentMethod === "bank_transfer"
                          ? "Plássið þitt er frátekið í 10 mínútur. Millifærðu greiðsluna og staðfestu hér að neðan."
                          : "Plássið þitt er frátekið í 10 mínútur. Staðfestu bókun hér að neðan."
                        }
                      </p>
                    </div>

                    {/* Payment Instructions */}
                    {paymentMethod === "bank_transfer" ? (
                      <>
                        {/* Bank Transfer Instructions */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
                          <h4 className="font-semibold text-blue-900 mb-2">Millifærsluupplýsingar:</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p><strong>Banki:</strong> Íslandsbanki</p>
                            <p><strong>Reikningur:</strong> 0133-26-012345</p>
                            <p><strong>Upphæð:</strong> {actualPrice.toLocaleString('is-IS')} kr.</p>
                            <p className="text-xs mt-2 text-blue-600">
                              Nákvæmar upplýsingar koma í staðfestingarpósti
                            </p>
                          </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="border-2 border-primary/30 rounded-lg p-4 bg-gradient-to-r from-primary/5 to-primary/10">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id="confirm-transfer"
                              checked={hasConfirmedTransfer}
                              onCheckedChange={(checked) => setHasConfirmedTransfer(checked as boolean)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor="confirm-transfer"
                                className="text-sm font-semibold cursor-pointer block mb-1"
                              >
                                ✓ Ég hef millifært greiðsluna
                              </label>
                              <p className="text-xs text-muted-foreground">
                                Hakið í þennan reit þegar þú hefur sent millifærsluna
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-900 mb-2">Borga við komu</h4>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>Þú greiðir {actualPrice.toLocaleString('is-IS')} kr. þegar þú mætir í tímanum.</p>
                          <p className="text-xs mt-2 text-green-600">
                            Við tökum á móti reiðufé og kortum
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confirm Button */}
                    <Button
                      size="lg"
                      className="w-full"
                      disabled={(paymentMethod === "bank_transfer" && !hasConfirmedTransfer) || confirmRegistrationMutation.isPending}
                      onClick={() => confirmRegistrationMutation.mutate()}
                    >
                      {confirmRegistrationMutation.isPending ? (
                        "Staðfesti..."
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Staðfesta bókun
                        </>
                      )}
                    </Button>

                    {/* Cancel Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => cancelReservationMutation.mutate()}
                    >
                      Hætta við bókun
                    </Button>
                  </div>
                )}

                {step === "success" && (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Bókun tókst!</h3>
                      <p className="text-muted-foreground mb-4">
                        Staðfestingarpóstur verður sendur á netfangið þitt
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => setLocation("/dashboard")}
                      >
                        Fara í mína bókun
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full"
                        onClick={() => setLocation("/")}
                      >
                        Til baka á forsíðu
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
