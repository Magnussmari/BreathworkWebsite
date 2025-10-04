import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Calendar, 
  Clock, 
  User, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  BookOpen,
  Settings,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.string().min(1, "Price is required"),
  maxCapacity: z.number().min(1, "Capacity must be at least 1"),
  category: z.string().min(1, "Category is required"),
  prerequisites: z.string().optional(),
});

const classFormSchema = z.object({
  templateId: z.string().min(1, "Class template is required"),
  scheduledDate: z.string().min(1, "Date and time are required"),
  location: z.string().min(1, "Location is required"),
  maxCapacity: z.number().min(1, "Capacity must be at least 1"),
  customPrice: z.number().optional(),
  instructorNotes: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceFormSchema>;
type ClassFormData = z.infer<typeof classFormSchema>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive",
      });
      window.location.href = "/";
      return;
    }
  }, [user, toast]);

  // Handle unauthorized error
  const handleUnauthorizedError = (error: Error) => {
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return true;
    }
    return false;
  };

  // Data fetching
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['/api/analytics/bookings'],
    retry: false,
  });

  const { data: allBookings, isLoading: bookingsLoading, error: bookingsError } = useQuery({
    queryKey: ['/api/bookings', 'admin'],
    retry: false,
  });

  const { data: allServices, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['/api/services/all'],
    queryFn: async () => {
      // Fetch all services including inactive ones for admin
      const response = await fetch('/api/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    retry: false,
  });

  const { data: instructors, isLoading: instructorsLoading, error: instructorsError } = useQuery({
    queryKey: ['/api/instructors/all'],
    queryFn: async () => {
      const response = await fetch('/api/instructors');
      if (!response.ok) throw new Error('Failed to fetch instructors');
      return response.json();
    },
    retry: false,
  });

  const { data: classTemplates } = useQuery({
    queryKey: ['/api/class-templates'],
    retry: false,
  });

  const { data: classesData, isLoading: classesLoading, error: classesError } = useQuery({
    queryKey: ['/api/classes/all'],
    queryFn: async () => {
      const response = await fetch('/api/classes/all', {
        credentials: "include"
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
    retry: false,
  });

  // Handle errors
  useEffect(() => {
    const errors = [analyticsError, bookingsError, servicesError, instructorsError, classesError].filter(Boolean);
    errors.forEach((error) => {
      if (error && handleUnauthorizedError(error as Error)) return;
    });
  }, [analyticsError, bookingsError, servicesError, instructorsError, classesError]);

  // Service form
  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 60,
      price: "",
      maxCapacity: 1,
      category: "",
      prerequisites: "",
    },
  });

  // Class form
  const classForm = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      templateId: "",
      scheduledDate: "",
      location: "Reykjavík, Iceland",
      maxCapacity: 15,
      instructorNotes: "",
    },
  });

  // Mutations
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceFormData) => {
      await apiRequest("POST", "/api/services", {
        ...serviceData,
        price: serviceData.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services/all'] });
      setServiceDialogOpen(false);
      serviceForm.reset();
      toast({
        title: "Service Created",
        description: "The new service has been created successfully.",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error as Error)) return;
      toast({
        title: "Creation Failed",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: ServiceFormData & { id: string }) => {
      const { id, ...data } = serviceData;
      await apiRequest("PUT", `/api/services/${id}`, {
        ...data,
        price: data.price,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services/all'] });
      setServiceDialogOpen(false);
      setEditingService(null);
      serviceForm.reset();
      toast({
        title: "Service Updated",
        description: "The service has been updated successfully.",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error as Error)) return;
      toast({
        title: "Update Failed",
        description: "Failed to update service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      await apiRequest("DELETE", `/api/services/${serviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services/all'] });
      toast({
        title: "Service Deleted",
        description: "The service has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error as Error)) return;
      toast({
        title: "Deletion Failed",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (classData: ClassFormData) => {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(classData),
      });
      if (!response.ok) throw new Error("Failed to create class");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/classes/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes/upcoming'] });
      setClassDialogOpen(false);
      classForm.reset();
      toast({
        title: "Class Created",
        description: "The breathwork class has been scheduled successfully.",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error as Error)) return;
      toast({
        title: "Creation Failed",
        description: "Failed to create class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (timeSlotId: string) => {
      await apiRequest("DELETE", `/api/time-slots/${timeSlotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/time-slots', 'admin'] });
      toast({
        title: "Session Deleted",
        description: "The session has been deleted successfully.",
      });
    },
    onError: (error) => {
      if (handleUnauthorizedError(error as Error)) return;
      toast({
        title: "Deletion Failed",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Loading state
  if (analyticsLoading || bookingsLoading || servicesLoading || instructorsLoading) {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="bg-muted h-8 w-64 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-muted h-24 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access denied for non-admin users
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen pt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-4" data-testid="access-denied-title">
                Access Denied
              </h1>
              <p className="text-muted-foreground mb-6" data-testid="access-denied-description">
                You don't have permission to access the admin dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleEditService = (service: any) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      maxCapacity: service.maxCapacity,
      category: service.category,
      prerequisites: service.prerequisites || "",
    });
    setServiceDialogOpen(true);
  };

  const handleCreateService = () => {
    setEditingService(null);
    serviceForm.reset();
    setServiceDialogOpen(true);
  };

  const onServiceSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ ...data, id: editingService.id });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const onClassSubmit = (data: ClassFormData) => {
    createClassMutation.mutate(data);
  };

  const handleCreateClass = () => {
    classForm.reset();
    setClassDialogOpen(true);
  };

  const upcomingClasses = classesData?.filter((classItem: any) => {
    const scheduledDate = new Date(classItem.scheduledDate);
    return scheduledDate > new Date() && classItem.status === 'upcoming';
  }).sort((a: any, b: any) => {
    const aTime = new Date(a.scheduledDate).getTime();
    const bTime = new Date(b.scheduledDate).getTime();
    return aTime - bTime;
  }) || [];

  const todayBookings = allBookings?.filter((booking: any) => {
    const bookingDate = new Date(booking.timeSlots.startTime);
    const today = new Date();
    return bookingDate.toDateString() === today.toDateString();
  }) || [];

  const pendingBookings = allBookings?.filter((booking: any) => 
    booking.bookings.status === 'pending'
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700">Completed</Badge>;
      case 'no_show':
        return <Badge variant="destructive">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2" data-testid="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground" data-testid="admin-dashboard-subtitle">
              Manage your breathwork platform, services, and bookings
            </p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-primary mr-3" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-total-bookings">
                    {analytics?.totalBookings || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-revenue">
                    {analytics?.totalRevenue ? `${analytics.totalRevenue} ISK` : '0 ISK'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-today-bookings">
                    {todayBookings.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Today's Bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-amber-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-foreground" data-testid="stat-pending">
                    {pendingBookings.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Approval</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-full">
            <TabsTrigger value="overview" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              Services
            </TabsTrigger>
            <TabsTrigger value="instructors" data-testid="tab-instructors">
              Instructors
            </TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl" data-testid="recent-bookings-title">
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allBookings?.slice(0, 5).map((booking: any) => (
                      <div key={booking.bookings.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{booking.services.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.users.firstName} {booking.users.lastName} • {format(new Date(booking.timeSlots.startTime), 'MMM d, h:mm a')}
                          </div>
                        </div>
                        {getStatusBadge(booking.bookings.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Services Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-xl" data-testid="services-overview-title">
                    Services Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Services</span>
                      <Badge variant="secondary" data-testid="total-services-count">
                        {allServices?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Services</span>
                      <Badge variant="default" data-testid="active-services-count">
                        {allServices?.filter((s: any) => s.isActive)?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Instructors</span>
                      <Badge variant="secondary" data-testid="total-instructors-count">
                        {instructors?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="sessions-management-title">
                Schedule Management
              </h2>
              <Button onClick={handleCreateClass} data-testid="button-add-class">
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tími</TableHead>
                      <TableHead>Dagsetning</TableHead>
                      <TableHead>Staðsetning</TableHead>
                      <TableHead>Bókanir</TableHead>
                      <TableHead>Verð</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingClasses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Engir tímar. Búðu til fyrsta tíminn þinn.
                        </TableCell>
                      </TableRow>
                    ) : (
                      upcomingClasses.map((classItem: any) => {
                        const scheduledDate = new Date(classItem.scheduledDate);
                        const actualPrice = classItem.customPrice || classItem.template?.price || 0;
                        const spotsLeft = classItem.maxCapacity - classItem.currentBookings;

                        return (
                          <TableRow key={classItem.id} data-testid={`class-row-${classItem.id}`}>
                            <TableCell className="font-medium">{classItem.template?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{format(scheduledDate, 'dd. MMM yyyy')}</div>
                                <div className="text-muted-foreground">
                                  {format(scheduledDate, 'HH:mm')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{classItem.location}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <span className={spotsLeft === 0 ? "text-destructive font-medium" : ""}>
                                  {classItem.currentBookings}/{classItem.maxCapacity}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {spotsLeft === 0 ? "Fullt" : `${spotsLeft} laus`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {actualPrice.toLocaleString('is-IS')} kr
                                {classItem.customPrice && (
                                  <div className="text-xs text-muted-foreground">
                                    (sérsniðið)
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="services-management-title">
                Service Management
              </h2>
              <Button onClick={handleCreateService} data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allServices?.map((service: any) => (
                      <TableRow key={service.id} data-testid={`service-row-${service.id}`}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.category}</Badge>
                        </TableCell>
                        <TableCell>{service.duration} min</TableCell>
                        <TableCell>{service.price} ISK</TableCell>
                        <TableCell>{service.maxCapacity}</TableCell>
                        <TableCell>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              data-testid={`button-edit-${service.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" data-testid={`button-delete-${service.id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Service</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{service.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteServiceMutation.mutate(service.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructors" className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="instructors-management-title">
              Instructor Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors?.map((instructor: any) => (
                <Card key={instructor.instructors.id} data-testid={`instructor-card-${instructor.instructors.id}`}>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <img
                        src={instructor.users.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                        alt={`${instructor.users.firstName} ${instructor.users.lastName}`}
                        className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                      />
                      <h3 className="font-semibold text-foreground">
                        {instructor.users.firstName} {instructor.users.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{instructor.users.email}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={instructor.instructors.isActive ? "default" : "secondary"}>
                          {instructor.instructors.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      {instructor.instructors.specializations && instructor.instructors.specializations.length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-xs">Specializations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {instructor.instructors.specializations.slice(0, 2).map((spec: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="bookings-management-title">
              All Bookings
            </h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings?.slice(0, 20).map((booking: any) => (
                      <TableRow key={booking.bookings.id} data-testid={`booking-row-${booking.bookings.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.users.firstName} {booking.users.lastName}</div>
                            <div className="text-sm text-muted-foreground">{booking.users.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.services.name}</TableCell>
                        <TableCell>
                          {booking.instructors.users.firstName} {booking.instructors.users.lastName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{format(new Date(booking.timeSlots.startTime), 'MMM d, yyyy')}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(booking.timeSlots.startTime), 'h:mm a')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.bookings.status)}</TableCell>
                        <TableCell>
                          <Badge variant={booking.bookings.paymentStatus === 'paid' ? "default" : "destructive"}>
                            {booking.bookings.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>{booking.services.price} ISK</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="font-serif text-2xl font-bold text-foreground" data-testid="analytics-title">
              Platform Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground" data-testid="analytics-completed">
                    {analytics?.completedBookings || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed Sessions</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground" data-testid="analytics-clients">
                    {allBookings ? new Set(allBookings.map((b: any) => b.users.id)).size : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Unique Clients</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground" data-testid="analytics-avg-price">
                    {allServices?.length > 0 
                      ? Math.round(allServices.reduce((sum: number, s: any) => sum + parseFloat(s.price), 0) / allServices.length)
                      : 0
                    } ISK
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Service Price</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-destructive" data-testid="analytics-cancelled">
                    {analytics?.cancelledBookings || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Cancelled Bookings</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Service Dialog */}
        <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
          <DialogContent className="max-w-2xl" data-testid="service-dialog">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
              <DialogDescription>
                {editingService ? 'Update the service details below.' : 'Add a new breathwork service to your platform.'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...serviceForm}>
              <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={serviceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Introduction to Breathwork" data-testid="input-service-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="healing">Healing</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                            <SelectItem value="group">Group</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={serviceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe the service, its benefits, and what participants can expect..."
                          className="resize-none"
                          rows={3}
                          data-testid="textarea-service-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={serviceForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-service-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (ISK) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. 4500" data-testid="input-service-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={serviceForm.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Capacity *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-service-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={serviceForm.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any prerequisites or requirements for this service..."
                          className="resize-none"
                          rows={2}
                          data-testid="textarea-service-prerequisites"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setServiceDialogOpen(false);
                      setEditingService(null);
                      serviceForm.reset();
                    }}
                    data-testid="button-cancel-service"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                    data-testid="button-save-service"
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Class Creation Dialog */}
        <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
          <DialogContent className="max-w-xl" data-testid="class-dialog">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                Create New Class
              </DialogTitle>
              <DialogDescription>
                Schedule a new breathwork class by selecting the template, date, time, and location.
              </DialogDescription>
            </DialogHeader>

            <Form {...classForm}>
              <form onSubmit={classForm.handleSubmit(onClassSubmit)} className="space-y-4">
                <FormField
                  control={classForm.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Template *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classTemplates?.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({template.duration} min • {template.price} ISK)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="datetime-local"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Reykjavík, Iceland" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="maxCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Capacity *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="customPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sérsniðið verð (valfrjálst)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          placeholder="Sjálfgefið verð notað ef autt"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Ef þú vilt nota annað verð en template-ið gefur, sláðu það inn hér
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={classForm.control}
                  name="instructorNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any special notes for this class..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setClassDialogOpen(false);
                      classForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createClassMutation.isPending}
                  >
                    {createClassMutation.isPending ? "Creating..." : "Create Class"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
