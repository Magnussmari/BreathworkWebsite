import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import InstructorCard from "@/components/instructor-card";

export default function Instructors() {
  const { data: instructors, isLoading } = useQuery({
    queryKey: ['/api/instructors'],
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-4"></div>
                <div className="bg-muted h-6 w-32 mx-auto mb-2 rounded"></div>
                <div className="bg-muted h-4 w-24 mx-auto rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground mb-4" data-testid="instructors-title">
            Meet Our Certified Instructors
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="instructors-description">
            Our breathwork facilitators are highly trained professionals dedicated to creating safe, 
            transformative experiences. Each brings unique specializations and years of experience 
            in guiding healing journeys.
          </p>
        </div>

        {/* Instructors Grid */}
        {instructors && Array.isArray(instructors) && instructors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {instructors.map((instructor: any) => (
            <div key={instructor.instructors.id} className="relative">
              <InstructorCard instructor={instructor} />
              
              {/* Extended Details */}
              <Card className="mt-4 bg-muted/30">
                <CardContent className="p-4">
                  {instructor.instructors.specializations && instructor.instructors.specializations.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-sm text-foreground mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-1">
                        {instructor.instructors.specializations.map((spec: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {instructor.instructors.certifications && instructor.instructors.certifications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-foreground mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-1">
                        {instructor.instructors.certifications.map((cert: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No instructors available at this time.</p>
          </div>
        )}

        {/* What Makes Our Instructors Special */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-none">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-3xl font-bold" data-testid="special-title">
              What Makes Our Instructors Special
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center" data-testid="special-training">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Certified Training</h3>
                <p className="text-muted-foreground">
                  All instructors complete rigorous certification programs in breathwork facilitation, 
                  trauma-informed practices, and safety protocols.
                </p>
              </div>

              <div className="text-center" data-testid="special-experience">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Extensive Experience</h3>
                <p className="text-muted-foreground">
                  Years of personal practice and professional facilitation ensure deep understanding 
                  of breathwork techniques and their effects.
                </p>
              </div>

              <div className="text-center" data-testid="special-approach">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-2">Personalized Approach</h3>
                <p className="text-muted-foreground">
                  Each instructor adapts sessions to individual needs, creating safe spaces 
                  for transformation while honoring personal boundaries.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructor Training */}
        <div className="mt-16 text-center">
          <h2 className="font-serif text-3xl font-bold text-foreground mb-8" data-testid="training-title">
            Our Training Standards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-left" data-testid="training-requirements">
              <h3 className="font-semibold text-xl text-foreground mb-4">Minimum Requirements</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  200+ hours breathwork facilitator training
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Trauma-informed practice certification
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  First aid and CPR certification
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Ongoing supervision and mentorship
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Personal breathwork practice (minimum 2 years)
                </li>
              </ul>
            </div>
            
            <div className="text-left" data-testid="training-ongoing">
              <h3 className="font-semibold text-xl text-foreground mb-4">Ongoing Development</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  Monthly team supervision sessions
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  Quarterly advanced training workshops
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  Annual certification renewal
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  Peer feedback and evaluation
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  Continuing education requirements
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
