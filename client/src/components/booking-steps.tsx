interface BookingStepsProps {
  currentStep: number;
}

export default function BookingSteps({ currentStep }: BookingStepsProps) {
  const steps = [
    { number: 1, name: "Service", description: "Choose your session" },
    { number: 2, name: "Date & Time", description: "Pick when" },
    { number: 3, name: "Instructor", description: "Select facilitator" },
    { number: 4, name: "Details", description: "Your information" },
    { number: 5, name: "Payment", description: "Complete booking" },
  ];

  return (
    <div className="mb-12" data-testid="booking-steps">
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
                  step.number === currentStep
                    ? 'bg-primary text-primary-foreground border-primary'
                    : step.number < currentStep
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
                data-testid={`step-circle-${step.number}`}
              >
                {step.number < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                  data-testid={`step-name-${step.number}`}
                >
                  {step.name}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 transition-all ${
                  step.number < currentStep ? 'bg-primary' : 'bg-border'
                }`}
                data-testid={`step-connector-${step.number}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
