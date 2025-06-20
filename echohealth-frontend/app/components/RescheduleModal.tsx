"use client";

import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { X } from 'lucide-react';

export default function RescheduleModal({ appointment, onClose }: { appointment: any; onClose: () => void; }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const availableTimes = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]; // TODO: Fetch real slots

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a new date and time.");
      return;
    }
    setIsRescheduling(true);
    // TODO: Implement API call to PUT /api/v1/appointments/:id/reschedule
    console.log(`Rescheduling appointment ${appointment.id} to ${format(selectedDate, 'PPP')} at ${selectedTime}`);
    setTimeout(() => { // Simulating API call
      alert("Appointment rescheduled successfully!");
      setIsRescheduling(false);
      onClose(); // Close the modal
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
            <X size={24}/>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Reschedule Appointment</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={{ before: new Date() }}
            classNames={{
                caption_label: 'text-lg font-bold text-slate-800',
                head_cell: 'text-slate-500 uppercase tracking-wider font-medium text-xs',
                day: 'h-9 w-9 p-0 rounded-full hover:bg-emerald-100 text-slate-700 transition-colors',
                day_selected: 'text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-500',
                day_today: 'bg-emerald-100 text-emerald-700 font-bold',
            }}
          />
          {/* Time Slots */}
          <div>
            {selectedDate && (
                <div>
                    <h4 className="font-semibold text-slate-700 mb-4">
                        Available Slots for <span className="text-emerald-600">{format(selectedDate, 'PPP')}</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {availableTimes.map(time => (
                            <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 rounded-lg border-2 text-center font-semibold transition-all duration-200 ${
                                selectedTime === time
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400'
                            }`}
                            >
                            {time}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
            <button onClick={handleReschedule} disabled={!selectedDate || !selectedTime || isRescheduling} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-3 rounded-full font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50">
                {isRescheduling ? 'Rescheduling...' : 'Confirm New Time'}
            </button>
        </div>
      </div>
    </div>
  );
}