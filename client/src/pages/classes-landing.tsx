import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import type { Class, ClassTemplate } from "@shared/schema";

interface ClassWithTemplate extends Class {
  template: ClassTemplate;
}

export default function ClassesLanding() {
  const { user } = useAuth();
  const { data: upcomingClasses, isLoading } = useQuery<ClassWithTemplate[]>({
    queryKey: ["/api/classes?type=upcoming"],
  });

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

  const spotsAvailable = (classItem: Class) => {
    return classItem.maxCapacity - classItem.currentBookings;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&h=800')] opacity-10 bg-cover bg-center"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <svg className="w-14 h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <path d="M8 12 Q12 8 16 12 Q12 16 8 12" strokeWidth="2" fill="none"/>
              </svg>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground">
                Breathwork
              </h1>
            </div>

            <p className="text-2xl sm:text-3xl font-light text-muted-foreground mb-4">
              Umbreyttu lífi þínu með 9D öndunaræfingum
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Upplifðu djúpa lækningu í gegnum fjölvíða öndunaræfingar í hjarta Íslands.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button
                  asChild
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold"
                >
                  <Link href="/dashboard">Bókanir mínar</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold"
                  >
                    <Link href="/login">Skráðu þig inn til að bóka</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="px-8 py-6 text-lg font-semibold"
                  >
                    <Link href="/register">Búðu til aðgang</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Væntanlegir tímar
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Taktu þátt í umbreytandi 9D öndunaræfingum. Bókaðu pláss í dag.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : upcomingClasses && upcomingClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingClasses.map((classItem) => {
              const spots = spotsAvailable(classItem);
              const isAlmostFull = spots <= 3 && spots > 0;
              const isFull = spots === 0;

              return (
                <Card
                  key={classItem.id}
                  className="hover:shadow-xl transition-all group overflow-hidden border-2 hover:border-primary/20"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                    <img
                      src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
                      alt="9D Breathwork"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4">
                      {isFull ? (
                        <Badge variant="destructive" className="text-sm font-semibold">
                          Uppselt
                        </Badge>
                      ) : isAlmostFull ? (
                        <Badge variant="secondary" className="text-sm font-semibold bg-orange-500 text-white">
                          Aðeins {spots} pláss eftir!
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {spots} pláss laus
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="font-serif text-2xl font-semibold text-foreground mb-4">
                      {classItem.template.name}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-5 h-5 mr-3 text-primary" />
                        <span className="text-sm font-medium">{formatDate(classItem.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-5 h-5 mr-3 text-primary" />
                        <span className="text-sm font-medium">{formatTime(classItem.scheduledDate)} · {classItem.template.duration} mínútur</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-5 h-5 mr-3 text-primary" />
                        <span className="text-sm font-medium">{classItem.location}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-5 h-5 mr-3 text-primary" />
                        <span className="text-sm font-medium">{classItem.currentBookings}/{classItem.maxCapacity} registered</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-bold text-foreground">
                        {(classItem.customPrice || classItem.template.price).toLocaleString('is-IS')} ISK
                      </span>
                    </div>

                    <Button
                      asChild
                      className="w-full"
                      size="lg"
                      disabled={isFull}
                    >
                      {isFull ? (
                        <span>Uppselt</span>
                      ) : (
                        <Link href={`/class/${classItem.id}`}>Bóka pláss</Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">Engir væntanlegir tímar</h3>
            <p className="text-muted-foreground mb-6">Athugaðu aftur fljótlega fyrir nýja öndunaræfinga.</p>
          </div>
        )}
      </div>

      {/* What is 9D Breathwork */}
      <div className="bg-card/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-center text-foreground mb-8">
            Hvað er 9D öndunaræfingar?
          </h2>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            9D öndunaræfingar eru byltingarkennd fjölvíð nálgun sem sameinar níu öflug þætti til að skapa djúpstæða umbreytingu:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Meðvituð öndun", desc: "Leiðbeindar öndunaræfingar" },
              { title: "Líkamsmeðferð", desc: "Líkamstengd lækning" },
              { title: "Dáleiðsla", desc: "Huglægar tillögur" },
              { title: "Hljóðlækning", desc: "Solfeggio tíðnir" },
              { title: "432hz stillingar", desc: "Harmonísk jöfnun" },
              { title: "Tvíeyru slög", desc: "Heilaþjálfun" },
              { title: "Isochronic tónar", desc: "Heilabylgjubætingar" },
              { title: "Rýmisljóð", desc: "3D hljóðupplifun" },
              { title: "Leiðbeint þjálfun", desc: "Sérfræðileiðsögn" },
            ].map((element, i) => (
              <div key={i} className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">{i + 1}</span>
                </div>
                <h4 className="font-semibold text-foreground mb-1">{element.title}</h4>
                <p className="text-sm text-muted-foreground">{element.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M8 12 Q12 8 16 12 Q12 16 8 12" strokeWidth="2" fill="none"/>
            </svg>
            <span className="font-serif text-xl font-bold">Breathwork</span>
          </div>
          <p className="text-muted-foreground mb-2">Breathwork ehf.</p>
          <p className="text-sm text-muted-foreground">Umbreyttu lífi þínu með öndunaræfingum á Íslandi</p>
        </div>
      </footer>
    </div>
  );
}
