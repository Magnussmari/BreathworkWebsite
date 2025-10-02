import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableSlots?: any[];
}

export default function CalendarView({ selectedDate, onDateSelect, availableSlots = [] }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startOfCalendar = new Date(startOfMonth);
  const endOfCalendar = new Date(endOfMonth);

  // Adjust to show full weeks
  const startDay = startOfMonth.getDay();
  startOfCalendar.setDate(startOfCalendar.getDate() - startDay);
  
  const endDay = endOfMonth.getDay();
  if (endDay !== 6) {
    endOfCalendar.setDate(endOfCalendar.getDate() + (6 - endDay));
  }

  const days = [];
  const current = new Date(startOfCalendar);
  
  while (current <= endOfCalendar) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const isDateAvailable = (date: Date) => {
    // Don't allow booking in the past
    if (date < today) return false;
    
    // Check if there are available slots for this date
    return availableSlots.some(slot => {
      const slotDate = new Date(slot.timeSlots.startTime);
      return (
        slotDate.getDate() === date.getDate() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-card rounded-lg p-4" data-testid="calendar-view">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground" data-testid="calendar-month">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousMonth}
            data-testid="button-previous-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextMonth}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const available = isDateAvailable(date);
          const currentMonthDay = isCurrentMonth(date);
          const selected = isSelected(date);
          const isPast = date < today;

          return (
            <button
              key={index}
              className={`
                calendar-day aspect-square p-2 text-sm rounded-lg transition-all
                ${!currentMonthDay 
                  ? 'text-muted-foreground/40' 
                  : isPast
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : available
                  ? 'text-foreground hover:bg-primary/10 hover:text-primary cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed'
                }
                ${selected ? 'bg-primary text-primary-foreground font-semibold' : ''}
                ${!available && !selected ? 'opacity-50' : ''}
              `}
              onClick={() => available && onDateSelect(date)}
              disabled={!available}
              data-testid={`calendar-day-${date.getDate()}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
