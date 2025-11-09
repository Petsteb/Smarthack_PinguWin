import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'; 

// --- Type Definitions ---

type TimeSlot = string;

// The available hours represent ALL possible slots for a day (e.g., 08:00, 09:00...)
// The booked hours are the ones already taken for the current day.
interface BookingCalendarProps {
  allAvailableHours: TimeSlot[]; 
  bookedHours: TimeSlot[];
  onBook: (date: Date, time: TimeSlot) => void;
}

// --- Helper Functions (No Change) ---

const getMonthName = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const getDaysOfMonth = (year: number, month: number): (number | null)[] => {
  const date = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDayOfWeek = date.getDay();
  
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) { days.push(null); }
  for (let i = 1; i <= daysInMonth; i++) { days.push(i); }

  return days;
};

// --- React Component ---

const BookingCalendar: React.FC<BookingCalendarProps> = ({ allAvailableHours, bookedHours, onBook }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [view, setView] = useState<'calendar' | 'hours'>('calendar'); 

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // Use useMemo for 'today' to ensure stability
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(() => getDaysOfMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  // --- Handlers (Slight changes to handleMonthChange and handleDaySelect) ---

  const handleMonthChange = (offset: 1 | -1) => {
    setCurrentDate(prevDate => new Date(prevDate.getFullYear(), prevDate.getMonth() + offset, 1));
    setSelectedDay(null); 
    setView('calendar');
  };

  const handleDaySelect = (day: number | null) => {
    if (day !== null) {
      const targetDate = new Date(currentYear, currentMonth, day);
      if (targetDate < today) {
        return; 
      }
      setSelectedDay(day);
      setView('hours'); 
    }
  };

  const handleTimeSelect = (time: TimeSlot) => {
    // Only allow selection if the hour is NOT in the bookedHours list
    if (selectedDay !== null && !bookedHours.includes(time)) {
      const selectedDate = new Date(currentYear, currentMonth, selectedDay);
      onBook(selectedDate, time); 
    }
  };

  const handleBackToCalendar = () => {
    setSelectedDay(null);
    setView('calendar'); 
  };
  
  // --- Render Functions ---

  const renderCalendar = () => (
    <div className="p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <button 
          onClick={() => handleMonthChange(-1)} 
          className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {getMonthName(currentDate)}
        </h2>
        <button 
          onClick={() => handleMonthChange(1)} 
          className="p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Next Month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, index) => {
          const targetDate = day !== null ? new Date(currentYear, currentMonth, day) : null;
          const isPast = targetDate !== null && targetDate < today;
          const isSelected = day === selectedDay;
          
          let dayClasses = "p-2 rounded-lg cursor-pointer text-gray-700 transition-all";

          if (day === null) {
            dayClasses = "p-2"; 
          } else if (isPast) {
            dayClasses += " text-gray-400 cursor-not-allowed bg-gray-50";
          } else if (isSelected) {
            dayClasses += " bg-indigo-600 text-white font-bold shadow-md hover:bg-indigo-700";
          } else {
            dayClasses += " hover:bg-indigo-100 hover:text-indigo-800";
          }

          return (
            <div
              key={index}
              className={dayClasses}
              onClick={() => handleDaySelect(day)}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHours = () => {
    if (selectedDay === null) return null;

    const selectedDate = new Date(currentYear, currentMonth, selectedDay);
    const dateString = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    
    // Determine the actual slots that are NOT booked
    // Note: Use a Set for bookedHours for faster lookup if the list were very long
    // const nonBookedHours = allAvailableHours.filter(time => !bookedHours.includes(time));

    return (
      <div className="p-4">
        {/* Back Button */}
        <button 
          onClick={handleBackToCalendar} 
          className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Calendar
        </button>
        
        {/* Header */}
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-indigo-500"/> 
            <span className="text-indigo-600 ml-1">{dateString}</span>
        </h3>
        
        {/* Hour List */}
        <div className="flex flex-wrap gap-3 justify-start">
          {allAvailableHours.map((time, index) => {
            const isBooked = bookedHours.includes(time);
            
            // Base classes for all buttons
            let buttonClasses = "px-4 py-2 rounded-full font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 w-1/4 min-w-[100px]";

            if (isBooked) {
              // Grey and disabled for booked slots
              buttonClasses += " bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300";
            } else {
              // Primary color for non-booked (available) slots
              buttonClasses += " border border-indigo-500 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500";
            }

            return (
              <button 
                key={index} 
                className={buttonClasses} 
                onClick={() => handleTimeSelect(time)}
                disabled={isBooked}
              >
                <div className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {time}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white shadow-xl rounded-xl border border-gray-200">
      {view === 'calendar' ? renderCalendar() : renderHours()}
    </div>
  );
};

export default BookingCalendar;