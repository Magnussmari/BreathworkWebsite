import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Calendar, MapPin, Clock, CreditCard, Copy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Registration, Class, ClassTemplate, CompanyPaymentInfo } from "@shared/schema";

interface RegistrationWithDetails extends Registration {
  class: Class & { template: ClassTemplate };
}

export default function RegistrationSuccess() {
  const [, params] = useRoute("/registration/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const { data: registration, isLoading } = useQuery<RegistrationWithDetails>({
    queryKey: [`/api/registrations/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: paymentInfo } = useQuery<CompanyPaymentInfo[]>({
    queryKey: ["/api/payment-info"],
  });

  const activePaymentInfo = paymentInfo?.find(info => info.isActive);

  const confirmTransferMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/registrations/${params?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "confirm-transfer" }),
      });
      if (!response.ok) throw new Error("Failed to confirm transfer");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/registrations/${params?.id}`] });
      toast({
        title: "Staðfest!",
        description: "Þú hefur staðfest að millifærsla er á leiðinni. Við munum athuga greiðsluna innan 24 klst.",
      });
      setHasConfirmed(true);
    },
    onError: () => {
      toast({
        title: "Villa",
        description: "Gat ekki staðfest millifærslu. Reyndu aftur.",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Afritað!",
      description: `${label} hefur verið afritað`,
    });
  };

  if (isLoading || !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Takk fyrir bókunina!</h1>
          <p className="text-xl text-muted-foreground">
            Bókunin þín hefur verið skráð
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{registration.class.template.name}</CardTitle>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Bókunarnúmer: {registration.paymentReference || registration.id.slice(0, 8).toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Dagsetning</p>
                  <p className="text-muted-foreground">{formatDate(registration.class.scheduledDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Tími</p>
                  <p className="text-muted-foreground">
                    {formatTime(registration.class.scheduledDate)} · {registration.class.template.duration} mín
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Staðsetning</p>
                  <p className="text-muted-foreground">{registration.class.location}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CreditCard className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">Upphæð</p>
                  <p className="text-muted-foreground font-bold">
                    {registration.paymentAmount.toLocaleString('is-IS')} kr.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions Card */}
        {activePaymentInfo && (
          <Card className="mb-6 shadow-lg border-2 border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Greiðsluleiðbeiningar
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="font-semibold text-yellow-800 mb-2">
                  ⚠️ MIKILVÆGT: Greiða þarf innan 24 klukkustunda
                </p>
                <p className="text-sm text-yellow-700">
                  Ef greiðsla berst ekki innan þess tíma fellur bókunin sjálfkrafa niður.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Til að staðfesta plássið þitt, vinsamlegast millifærðu heildarupphæðina:</p>
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nafn</p>
                        <p className="font-bold text-lg">{activePaymentInfo.companyName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(activePaymentInfo.companyName, "Nafn")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Kennitala</p>
                        <p className="font-bold text-lg">{activePaymentInfo.companyId}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(activePaymentInfo.companyId, "Kennitala")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Reikningsnúmer</p>
                        <p className="font-bold text-xl">{activePaymentInfo.accountNumber}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(activePaymentInfo.accountNumber, "Reikningsnúmer")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Upphæð</p>
                        <p className="font-bold text-2xl text-primary">
                          {registration.paymentAmount.toLocaleString('is-IS')} kr.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(registration.paymentAmount.toString(), "Upphæð")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4">
                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">Skýring (NAUÐSYNLEGT!)</p>
                        <p className="font-bold text-lg">
                          {registration.paymentReference || registration.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => copyToClipboard(
                          registration.paymentReference || registration.id.slice(0, 8).toUpperCase(),
                          "Bókunarnúmer"
                        )}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Afrita
                      </Button>
                    </div>
                  </div>
                </div>

                {activePaymentInfo.instructions && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <p className="text-sm text-blue-800">{activePaymentInfo.instructions}</p>
                  </div>
                )}
              </div>

              {/* Confirmation Checkbox */}
              {!registration.userConfirmedTransfer && !hasConfirmed ? (
                <div className="border-2 border-primary/30 rounded-lg p-6 bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      id="confirm-transfer"
                      checked={hasConfirmed}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          confirmTransferMutation.mutate();
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="confirm-transfer"
                        className="text-base font-semibold cursor-pointer block mb-2"
                      >
                        ✓ Ég staðfesti að ég hef millifært greiðsluna
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Með því að haka í þennan reit staðfestir þú að þú hefur sent millifærsluna með réttum upplýsingum.
                        Við munum athuga greiðsluna í heimabanka innan 24 klukkustunda.
                      </p>
                    </div>
                  </div>
                  {confirmTransferMutation.isPending && (
                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span>Staðfesti...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">
                        Millifærsla staðfest af þér
                      </p>
                      <p className="text-sm text-green-700">
                        Við munum athuga greiðsluna í heimabanka og senda þér staðfestingu innan 24 klukkustunda.
                        Plássið þitt er frátekið!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p>✓ Plássið þitt er frátekið strax</p>
                <p>✓ Við athugum greiðsluna innan 24 klst.</p>
                <p>✓ Þú færð staðfestingu á tölvupósti þegar greiðsla er samþykkt</p>
                <p>✓ Ef greiðsla berst ekki fellur bókunin niður sjálfkrafa eftir 24 klst.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setLocation("/dashboard")}
            className="flex-1"
            size="lg"
          >
            Fara í mína bókun
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Til baka á forsíðu
          </Button>
        </div>

        {/* Email Reminder */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Staðfestingarpóstur hefur verið sendur á netfangið þitt með öllum greiðsluupplýsingum.</p>
        </div>
      </div>
    </div>
  );
}
