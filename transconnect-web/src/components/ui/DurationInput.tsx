'use client';
import React, { useState, useEffect } from 'react';

interface DurationInputProps {
  value?: number; // Duration in minutes
  onChange: (minutes: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function DurationInput({ 
  value = 0, 
  onChange, 
  label = 'Duration',
  placeholder = '',
  required = false,
  disabled = false,
  className = ''
}: DurationInputProps) {
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');

  // Convert total minutes to hours and minutes when value changes
  useEffect(() => {
    if (value > 0) {
      const h = Math.floor(value / 60);
      const m = value % 60;
      setHours(h.toString());
      setMinutes(m.toString());
    } else {
      setHours('');
      setMinutes('');
    }
  }, [value]);

  // Calculate total minutes and call onChange when hours or minutes change
  const updateDuration = (newHours: string, newMinutes: string) => {
    const h = parseInt(newHours) || 0;
    const m = parseInt(newMinutes) || 0;
    
    // Validation
    if (m >= 60) {
      // If minutes >= 60, adjust hours and minutes
      const totalMinutes = h * 60 + m;
      const adjustedHours = Math.floor(totalMinutes / 60);
      const adjustedMinutes = totalMinutes % 60;
      setHours(adjustedHours.toString());
      setMinutes(adjustedMinutes.toString());
      onChange(totalMinutes);
    } else {
      const totalMinutes = h * 60 + m;
      onChange(totalMinutes);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = e.target.value;
    setHours(newHours);
    updateDuration(newHours, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = e.target.value;
    setMinutes(newMinutes);
    updateDuration(hours, newMinutes);
  };

  const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Hours Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={handleHoursChange}
              placeholder="0"
              disabled={disabled}
              className="form-input w-full pr-12 text-center"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm">hrs</span>
            </div>
          </div>
        </div>

        <span className="text-gray-400 font-medium">:</span>

        {/* Minutes Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={handleMinutesChange}
              placeholder="00"
              disabled={disabled}
              className="form-input w-full pr-12 text-center"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 text-sm">min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Duration Summary */}
      {totalMinutes > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Total Duration:</span> {formatDuration(totalMinutes)}
            <span className="text-blue-600 ml-2">({totalMinutes} minutes)</span>
          </div>
        </div>
      )}

      {placeholder && !totalMinutes && (
        <p className="text-sm text-gray-500">{placeholder}</p>
      )}
    </div>
  );
}

import { formatDuration } from '@/lib/durationUtils';