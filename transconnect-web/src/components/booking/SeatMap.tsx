'use client';
import React from 'react';
import { Armchair, XCircle } from 'lucide-react';

type SeatType = 'regular' | 'window' | 'aisle' | 'premium';

interface Seat {
  number: string;
  type: SeatType;
  isBooked: boolean;
}

type Props = {
  capacity: number;
  bookedSeats?: string[];
  selectedSeats?: string[];
  maxSeats?: number;
  onSelect: (seats: string[]) => void;
};

export default function SeatMap({ capacity, bookedSeats = [], selectedSeats = [], maxSeats = 4, onSelect }: Props) {
  // Generate seats with types
  const generateSeats = (): Seat[] => {
    const seats: Seat[] = [];
    
    for (let i = 1; i <= capacity; i++) {
      const seatNumber = i.toString();
      let seatType: SeatType = 'regular';
      
      // Determine seat type based on position
      const row = Math.ceil(i / 4);
      const position = i % 4 || 4;
      
      // Front 2 rows are premium
      if (row <= 2) {
        seatType = 'premium';
      }
      // Window seats (positions 1 and 4)
      else if (position === 1 || position === 4) {
        seatType = 'window';
      }
      // Aisle seats (positions 2 and 3)
      else {
        seatType = 'aisle';
      }
      
      seats.push({
        number: seatNumber,
        type: seatType,
        isBooked: bookedSeats.includes(seatNumber),
      });
    }
    
    return seats;
  };

  const seats = generateSeats();
  const rows = Math.ceil(capacity / 4);
  const seatsPerRow = 4;

  const handleSeatClick = (seatNumber: string) => {
    if (bookedSeats.includes(seatNumber)) return;
    
    let newSelectedSeats: string[];
    
    if (selectedSeats.includes(seatNumber)) {
      // Deselect seat
      newSelectedSeats = selectedSeats.filter(s => s !== seatNumber);
    } else {
      // Select seat (up to maxSeats)
      if (selectedSeats.length >= maxSeats) {
        // Replace oldest selection with new one
        newSelectedSeats = [...selectedSeats.slice(1), seatNumber];
      } else {
        newSelectedSeats = [...selectedSeats, seatNumber];
      }
    }
    
    onSelect(newSelectedSeats);
  };

  const clearSelection = () => {
    onSelect([]);
  };

  const getSeatStyles = (seat: Seat) => {
    const isSelected = selectedSeats.includes(seat.number);
    
    if (seat.isBooked) {
      return 'bg-red-100 text-red-800 cursor-not-allowed border-2 border-red-200';
    }
    
    if (isSelected) {
      return 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-700';
    }
    
    return 'bg-[#eaf5ff] text-[#1f5f9f] hover:bg-[#dbedff] hover:shadow-md border-2 border-[#c8e2ff] hover:border-[#9fceff]';
  };

  const getSeatIconColor = (seat: Seat, isSelected: boolean) => {
    if (seat.isBooked) return 'text-red-600';
    if (isSelected) return 'text-white';
    return 'text-[#1f5f9f]';
  };

  return (
    <div className="space-y-6">
      {/* Bus Layout Header */}
      <div className="text-center">
        <div className="inline-block bg-gray-800 text-white px-6 py-3 rounded-t-xl text-sm font-medium">
          Front of Bus (Driver)
        </div>
      </div>

      {/* Seat Grid */}
      <div className="max-w-lg mx-auto">
        <div className="text-xs text-gray-500 text-center mb-3">Tap a seat to select or deselect. Maximum {maxSeats} seats.</div>
        {Array.from({ length: rows }, (_, rowIndex) => {
          const rowSeats = seats.slice(rowIndex * seatsPerRow, (rowIndex + 1) * seatsPerRow);
          const leftSeats = rowSeats.slice(0, 2);
          const rightSeats = rowSeats.slice(2, 4);

          return (
            <div key={rowIndex} className="flex items-center justify-center gap-3 mb-3">
              <span className="w-6 text-xs font-semibold text-gray-500 text-right">{rowIndex + 1}</span>

              <div className="grid grid-cols-[repeat(2,minmax(0,1fr))_20px_repeat(2,minmax(0,1fr))] gap-2 items-center">
                {leftSeats.map((seat) => (
                  <div key={seat.number} className="relative">
                    {(() => {
                      const isSelected = selectedSeats.includes(seat.number);
                      return (
                    <button
                      disabled={seat.isBooked}
                      onClick={() => handleSeatClick(seat.number)}
                      aria-label={`Seat ${seat.number}`}
                      className={`
                        relative h-14 w-14 rounded-xl font-semibold text-xs transition-all duration-200 shadow-sm
                        ${getSeatStyles(seat)}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full leading-none">
                        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 mb-1 ${getSeatIconColor(seat, isSelected)}`} aria-hidden="true">
                          <rect x="6" y="3" width="12" height="6" rx="2" fill="currentColor" opacity="0.85" />
                          <rect x="5" y="9" width="14" height="9" rx="2" fill="currentColor" />
                          <rect x="7" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.8" />
                          <rect x="15" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.8" />
                        </svg>
                        <span className="font-bold">{seat.number}</span>
                      </div>

                      {selectedSeats.includes(seat.number) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {selectedSeats.indexOf(seat.number) + 1}
                        </span>
                      )}

                    </button>
                      );
                    })()}
                  </div>
                ))}

                <div className="h-full w-5 rounded-md bg-gray-100 border border-dashed border-gray-300" aria-hidden="true" />

                {rightSeats.map((seat) => (
                  <div key={seat.number} className="relative">
                    {(() => {
                      const isSelected = selectedSeats.includes(seat.number);
                      return (
                    <button
                      disabled={seat.isBooked}
                      onClick={() => handleSeatClick(seat.number)}
                      aria-label={`Seat ${seat.number}`}
                      className={`
                        relative h-14 w-14 rounded-xl font-semibold text-xs transition-all duration-200 shadow-sm
                        ${getSeatStyles(seat)}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center h-full leading-none">
                        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 mb-1 ${getSeatIconColor(seat, isSelected)}`} aria-hidden="true">
                          <rect x="6" y="3" width="12" height="6" rx="2" fill="currentColor" opacity="0.85" />
                          <rect x="5" y="9" width="14" height="9" rx="2" fill="currentColor" />
                          <rect x="7" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.8" />
                          <rect x="15" y="18" width="2" height="3" rx="1" fill="currentColor" opacity="0.8" />
                        </svg>
                        <span className="font-bold">{seat.number}</span>
                      </div>

                      {selectedSeats.includes(seat.number) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-gray-900 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {selectedSeats.indexOf(seat.number) + 1}
                        </span>
                      )}

                    </button>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#eaf5ff] border-2 border-[#c8e2ff] rounded flex items-center justify-center">
              <Armchair className="h-3.5 w-3.5 text-[#1f5f9f]" />
            </div>
            <div>
              <div className="font-medium text-[#1f5f9f]">Available</div>
              <div className="text-xs text-gray-600">Tap to select</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 border-2 border-blue-700 rounded flex items-center justify-center">
              <Armchair className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="font-medium text-blue-700">Selected</div>
              <div className="text-xs text-gray-600">Ready to book</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-200 rounded flex items-center justify-center">
              <XCircle className="h-3.5 w-3.5 text-red-700" />
            </div>
            <div>
              <div className="font-medium text-red-800">Booked</div>
              <div className="text-xs text-gray-600">Unavailable</div>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">All seats are charged at the same route fare.</p>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>Total Seats: {capacity}</span>
            <span>Booked: {bookedSeats.length}</span>
            <span>Available: {capacity - bookedSeats.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs gap-2">
            <span className="text-blue-600 font-medium">Selected: {selectedSeats.length}/{maxSeats}</span>
            {selectedSeats.length >= maxSeats && (
              <span className="text-amber-600">Maximum reached. Tap a selected seat to replace.</span>
            )}
          </div>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center text-sm text-blue-800 mb-3">
            <strong>Selected Seats ({selectedSeats.length}):</strong>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {selectedSeats.map((seatNumber, index) => {
              return (
                <div key={seatNumber} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-blue-200">
                  <span className="text-blue-600 font-medium">#{index + 1}</span>
                  <span className="font-medium inline-flex items-center gap-1">
                    <Armchair className="h-3.5 w-3.5" />
                    Seat {seatNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
            >
              Clear Selection
            </button>
          </div>

          <div className="text-center text-xs text-gray-600 mt-2">Uniform pricing applies to all selected seats.</div>
        </div>
      )}

      {/* Mobile sticky quick summary */}
      {selectedSeats.length > 0 && (
        <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md rounded-2xl border border-blue-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] text-gray-500">Selected seats</p>
              <p className="text-sm font-semibold text-[#1a3a5c]">{selectedSeats.join(', ')}</p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
