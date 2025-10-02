import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: string;
    maxCapacity: number;
    category: string;
  };
  showBookButton?: boolean;
}

export default function ServiceCard({ service, showBookButton = true }: ServiceCardProps) {
  const getCategoryBadgeVariant = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'beginner':
        return 'default';
      case 'popular':
      case 'most popular':
        return 'secondary';
      case 'premium':
      case 'advanced':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getServiceImage = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('introduction') || lowerName.includes('beginner')) {
      return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
    } else if (lowerName.includes('healing') || lowerName.includes('deep')) {
      return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
    } else if (lowerName.includes('private') || lowerName.includes('one-on-one')) {
      return "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
    } else if (lowerName.includes('retreat') || lowerName.includes('weekend')) {
      return "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
    } else {
      return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all" data-testid={`card-service-${service.id}`}>
      <img 
        src={getServiceImage(service.name)} 
        alt={service.name}
        className="w-full h-48 object-cover" 
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={getCategoryBadgeVariant(service.category)}>
            {service.category}
          </Badge>
          <span className="text-2xl font-bold text-foreground" data-testid={`price-${service.id}`}>
            {service.price} ISK
          </span>
        </div>
        
        <h3 className="font-serif text-2xl font-semibold text-foreground mb-3" data-testid={`name-${service.id}`}>
          {service.name}
        </h3>
        
        <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`description-${service.id}`}>
          {service.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {service.duration} minutes
          </div>
          {service.maxCapacity > 1 && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Up to {service.maxCapacity} people
            </div>
          )}
        </div>
        
        {showBookButton && (
          <Button asChild className="w-full" data-testid={`button-book-${service.id}`}>
            <Link href={`/booking?service=${service.id}`}>Book Session</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
