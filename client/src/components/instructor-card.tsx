import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface InstructorCardProps {
  instructor: {
    instructors: {
      id: string;
      bio?: string;
      specializations?: string[];
      certifications?: string[];
      experience?: string;
    };
    users: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  };
}

export default function InstructorCard({ instructor }: InstructorCardProps) {
  const getInstructorImage = (name: string) => {
    const firstName = name.toLowerCase();
    if (firstName.includes('sigríður') || firstName.includes('sigridur')) {
      return "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
    } else if (firstName.includes('björn') || firstName.includes('bjorn')) {
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
    } else if (firstName.includes('elín') || firstName.includes('elin')) {
      return "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
    } else {
      return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
    }
  };

  const getExperienceYears = (experience?: string) => {
    if (!experience) return "Professional";
    
    const match = experience.match(/(\d+)\s*year/i);
    if (match) {
      return `${match[1]} years experience`;
    }
    return "Experienced";
  };

  return (
    <Card className="text-center hover:shadow-lg transition-shadow" data-testid={`card-instructor-${instructor.instructors.id}`}>
      <CardContent className="p-6">
        <img
          src={instructor.users.profileImageUrl || getInstructorImage(instructor.users.firstName)}
          alt={`${instructor.users.firstName} ${instructor.users.lastName}`}
          className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-primary/20"
          data-testid={`image-instructor-${instructor.instructors.id}`}
        />
        
        <h3 className="font-semibold text-xl text-foreground mb-1" data-testid={`name-instructor-${instructor.instructors.id}`}>
          {instructor.users.firstName} {instructor.users.lastName}
        </h3>
        
        <p className="text-muted-foreground mb-2">
          {getExperienceYears(instructor.instructors.experience)}
        </p>
        
        {instructor.instructors.bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`bio-instructor-${instructor.instructors.id}`}>
            {instructor.instructors.bio}
          </p>
        )}
        
        {instructor.instructors.specializations && instructor.instructors.specializations.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {instructor.instructors.specializations.slice(0, 2).map((specialization, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {specialization}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
