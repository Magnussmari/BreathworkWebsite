import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, ArrowLeft, ArrowRight } from "lucide-react";
import BookingSteps from "@/components/booking-steps";
import CalendarView from "@/components/calendar-view";
import ServiceCard from "@/components/service-card";
import InstructorCard from "@/components/instructor-card";
import { apiRequest } from "@/lib/queryClient";

const bookingFormSchema = z.object({
  customFormData: z.object({
    experienceLevel: z.string().min(1, "Please select your experience level"),
    healthConditions: z.string().optional(),
    specialRequests: z.string().optional(),
    emergencyContact: z.string().min(1, "Emergency contact is required"),
    emergencyPhone: z.string().min(1, "Emergency phone is required"),
  }),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

export default function BookingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: instructors, isLoading: instructorsLoading } = useQuery({
    queryKey: ['/api/instructors'],
  });

  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['/api/time-slots', selectedService?.id, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedService || !selectedDate) return [];
      
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `/api/time-slots?serviceId=${selectedService.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch time slots');
      }
      
      return response.json();
    },
    enabled: !!(selectedService && selectedDate),
  });

  //  Fetch all slots (including unavailable) for waitlist
  const { data: allTimeSlots } = useQuery({
    queryKey: ['/api/time-slots-all', selectedService?.id, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedService || !selectedDate) return [];
      
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `/api/time-slots?serviceId=${selectedService.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&includeUnavailable=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch all time slots');
      }
      
      return response.json();
    },
    enabled: !!(selectedService && selectedDate && timeSlots?.length === 0),
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: async (timeSlotId: string) => {
      return await apiRequest("POST", "/api/waitlist", {
        timeSlotId,
        serviceId: selectedService.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to Waitlist",
        description: "We'll notify you if a spot opens up for this time slot.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      customFormData: {
        experienceLevel: "",
        healthConditions: "",
        specialRequests: "",
        emergencyContact: "",
        emergencyPhone: "",
      },
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Created",
        description: "Your booking has been created successfully. Proceeding to payment.",
      });
      
      // Redirect to checkout with booking ID
      window.location.href = `/checkout?bookingId=${data.id}`;
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleDateTimeSelect = (timeSlot: any, date: Date) => {
    setSelectedTimeSlot(timeSlot);
    setSelectedDate(date);
    setCurrentStep(3);
  };

  const handleInstructorSelect = (instructor: any) => {
    setSelectedInstructor(instructor);
    setCurrentStep(4);
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    if (!selectedService || !selectedTimeSlot || !selectedInstructor) {
      toast({
        title: "Incomplete Selection",
        description: "Please make sure all selections are complete",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      serviceId: selectedService.id,
      instructorId: selectedInstructor.instructors.id,
      timeSlotId: selectedTimeSlot.timeSlots.id,
      totalAmount: selectedService.price,
      depositAmount: selectedService.price, // Full payment required
      customFormData: data.customFormData,
      status: "pending",
      paymentStatus: "pending",
    };

    createBookingMutation.mutate(bookingData);
  };

  const goToNextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen pt-16 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <BookingSteps currentStep={currentStep} />

        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <Card className="mt-8" data-testid="step-service-selection">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">Select a Service</CardTitle>
              <p className="text-muted-foreground">Choose the breathwork session that resonates with you</p>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse bg-muted rounded-lg h-48"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services?.map((service: any) => (
                    <div
                      key={service.id}
                      className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-primary ${
                        selectedService?.id === service.id ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleServiceSelect(service)}
                      data-testid={`service-option-${service.id}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-xl">{service.name}</h3>
                        <span className="text-xl font-bold">{service.price} ISK</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Clock className="w-4 h-4 mr-2" />
                        {service.duration} minutes
                      </div>
                      <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Date & Time Selection */}
        {currentStep === 2 && selectedService && (
          <Card className="mt-8" data-testid="step-datetime-selection">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">Choose Date & Time</CardTitle>
              <p className="text-muted-foreground">Select your preferred session date and time</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <CalendarView
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    availableSlots={timeSlots}
                  />
                </div>
                
                {selectedDate && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4">
                      Available Times - {selectedDate.toLocaleDateString()}
                    </h3>
                    {timeSlotsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse bg-muted rounded-lg h-16"></div>
                        ))}
                      </div>
                    ) : timeSlots?.length === 0 ? (
                      <div>
                        <p className="text-muted-foreground mb-4" data-testid="no-slots-message">
                          No available time slots for this date.
                        </p>
                        {allTimeSlots && allTimeSlots.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold mb-3">Join Waitlist for:</h4>
                            <div className="space-y-2">
                              {allTimeSlots.map((slot: any) => (
                                <div key={slot.timeSlots.id} className="flex justify-between items-center p-3 border rounded-lg">
                                  <div>
                                    <div className="font-medium">
                                      {new Date(slot.timeSlots.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.timeSlots.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      with {slot.instructors.user.firstName} {slot.instructors.user.lastName}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => joinWaitlistMutation.mutate(slot.timeSlots.id)}
                                    disabled={joinWaitlistMutation.isPending}
                                    data-testid={`button-waitlist-${slot.timeSlots.id}`}
                                  >
                                    Join Waitlist
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {timeSlots?.map((slot: any) => (
                          <button
                            key={slot.timeSlots.id}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                              selectedTimeSlot?.timeSlots.id === slot.timeSlots.id ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                            onClick={() => handleDateTimeSelect(slot, selectedDate)}
                            data-testid={`time-slot-${slot.timeSlots.id}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-semibold">
                                  {new Date(slot.timeSlots.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.timeSlots.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  with {slot.instructors.user.firstName} {slot.instructors.user.lastName}
                                </div>
                              </div>
                              <div className="text-sm text-primary font-medium">Available</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goToPreviousStep} data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
                </Button>
                {selectedTimeSlot && (
                  <Button onClick={goToNextStep} data-testid="button-continue">
                    Continue to Instructor <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Instructor Selection */}
        {currentStep === 3 && selectedTimeSlot && (
          <Card className="mt-8" data-testid="step-instructor-selection">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">Choose Your Instructor</CardTitle>
              <p className="text-muted-foreground">Select a certified breathwork facilitator for your session</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pre-select the instructor from the time slot */}
                <div
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all bg-primary/5 border-primary`}
                  onClick={() => handleInstructorSelect(selectedTimeSlot)}
                  data-testid={`instructor-${selectedTimeSlot.instructors.id}`}
                >
                  <img
                    src={selectedTimeSlot.instructors.user.profileImageUrl || `https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`}
                    alt={`${selectedTimeSlot.instructors.user.firstName} ${selectedTimeSlot.instructors.user.lastName}`}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h3 className="font-semibold text-lg text-center mb-1">
                    {selectedTimeSlot.instructors.user.firstName} {selectedTimeSlot.instructors.user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-3">
                    Available for this time slot
                  </p>
                  {selectedTimeSlot.instructors.bio && (
                    <p className="text-sm text-muted-foreground text-center">
                      {selectedTimeSlot.instructors.bio.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={goToPreviousStep} data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Time
                </Button>
                {selectedInstructor && (
                  <Button onClick={goToNextStep} data-testid="button-continue">
                    Continue to Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Details Form */}
        {currentStep === 4 && selectedInstructor && (
          <Card className="mt-8" data-testid="step-details-form">
            <CardHeader>
              <CardTitle className="text-3xl font-serif">Session Details</CardTitle>
              <p className="text-muted-foreground">Please provide some information to help us prepare for your session</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customFormData.experienceLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience with Breathwork *</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            className="w-full p-3 border border-input rounded-lg bg-background"
                            data-testid="select-experience"
                          >
                            <option value="">Select your experience level</option>
                            <option value="beginner">Complete beginner</option>
                            <option value="some">Some experience (1-5 sessions)</option>
                            <option value="experienced">Experienced (6+ sessions)</option>
                            <option value="advanced">Advanced practitioner</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customFormData.healthConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Health Conditions or Concerns</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Please mention any health conditions, medications, or physical limitations we should be aware of..."
                            className="resize-none"
                            data-testid="textarea-health"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customFormData.specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Requests or Goals</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Any specific goals for the session or special accommodations needed..."
                            className="resize-none"
                            data-testid="textarea-requests"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customFormData.emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Full name"
                              data-testid="input-emergency-contact"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customFormData.emergencyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Phone number"
                              type="tel"
                              data-testid="input-emergency-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={goToPreviousStep} data-testid="button-back">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Instructor
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createBookingMutation.isPending}
                      data-testid="button-create-booking"
                    >
                      {createBookingMutation.isPending ? 'Creating Booking...' : 'Create Booking & Pay'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Booking Summary Sidebar */}
        {(selectedService || selectedTimeSlot || selectedInstructor) && (
          <Card className="mt-8 bg-muted/30" data-testid="booking-summary">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService && (
                <div className="flex justify-between items-center" data-testid="summary-service">
                  <span className="font-medium">Service:</span>
                  <span>{selectedService.name}</span>
                </div>
              )}
              
              {selectedDate && selectedTimeSlot && (
                <div className="flex justify-between items-center" data-testid="summary-datetime">
                  <span className="font-medium">Date & Time:</span>
                  <div className="text-right">
                    <div>{selectedDate.toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedTimeSlot.timeSlots.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )}
              
              {selectedInstructor && (
                <div className="flex justify-between items-center" data-testid="summary-instructor">
                  <span className="font-medium">Instructor:</span>
                  <span>
                    {selectedInstructor.instructors.user.firstName} {selectedInstructor.instructors.user.lastName}
                  </span>
                </div>
              )}
              
              {selectedService && (
                <div className="flex justify-between items-center pt-4 border-t font-semibold text-lg" data-testid="summary-total">
                  <span>Total:</span>
                  <span>{selectedService.price} ISK</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
