import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/service-card";

export default function Services() {
  const { data: services, isLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="animate-pulse bg-muted h-12 w-64 mx-auto mb-4 rounded"></div>
            <div className="animate-pulse bg-muted h-6 w-96 mx-auto rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg h-96"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedServices = services?.reduce((acc: any, service: any) => {
    const category = service.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4" data-testid="services-title">
            Our Breathwork Services
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="services-description">
            Discover transformative breathwork experiences designed to reduce stress, increase energy, 
            and unlock your full potential. Each session is guided by our certified instructors 
            in a safe, supportive environment.
          </p>
        </div>

        {/* Services by Category */}
        {Object.entries(groupedServices).map(([category, categoryServices]) => (
          <div key={category} className="mb-16">
            <div className="flex items-center mb-8">
              <h2 className="font-serif text-2xl font-bold text-foreground" data-testid={`category-title-${category}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)} Sessions
              </h2>
              <Badge variant="secondary" className="ml-3">
                {(categoryServices as any[]).length} {(categoryServices as any[]).length === 1 ? 'Service' : 'Services'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(categoryServices as any[]).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        ))}

        {/* What to Expect Section */}
        <Card className="mt-16 bg-gradient-to-r from-primary/5 to-accent/5 border-none">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl font-bold" data-testid="expect-title">
              What to Expect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center" data-testid="expect-preparation">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Before Your Session</h3>
                <p className="text-muted-foreground">
                  Arrive 10 minutes early. Wear comfortable clothing and avoid eating heavy meals 2 hours before.
                </p>
              </div>

              <div className="text-center" data-testid="expect-during">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">During Your Session</h3>
                <p className="text-muted-foreground">
                  Experience guided breathing techniques in a safe, supportive environment with professional facilitators.
                </p>
              </div>

              <div className="text-center" data-testid="expect-after">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">After Your Session</h3>
                <p className="text-muted-foreground">
                  Take time to integrate your experience. Stay hydrated and journal about any insights or sensations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8" data-testid="benefits-title">
            Benefits of Breathwork
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="benefit-stress">
              <div className="text-3xl mb-2">🧘‍♀️</div>
              <h3 className="font-semibold text-foreground mb-1">Stress Reduction</h3>
              <p className="text-sm text-muted-foreground">Lower cortisol levels</p>
            </div>
            
            <div className="text-center" data-testid="benefit-energy">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-foreground mb-1">More Energy</h3>
              <p className="text-sm text-muted-foreground">Increased vitality</p>
            </div>
            
            <div className="text-center" data-testid="benefit-clarity">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold text-foreground mb-1">Mental Clarity</h3>
              <p className="text-sm text-muted-foreground">Better focus</p>
            </div>
            
            <div className="text-center" data-testid="benefit-healing">
              <div className="text-3xl mb-2">💚</div>
              <h3 className="font-semibold text-foreground mb-1">Emotional Healing</h3>
              <p className="text-sm text-muted-foreground">Process trauma</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
