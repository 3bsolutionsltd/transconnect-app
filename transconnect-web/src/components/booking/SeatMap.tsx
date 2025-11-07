'use client';
import React from 'react';

type SeatType = 'regular' | 'window' | 'aisle' | 'premium';

interface Seat {
  number: string;
  type: SeatType;
  isBooked: boolean;
  price?: number;
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
        price: seatType === 'premium' ? 15000 : 0 // Premium seats cost extra
      });
    }
    
    return seats;
  };

  const seats = generateSeats();
  const rows = Math.ceil(capacity / 4);

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

  const getSeatStyles = (seat: Seat) => {
    const isSelected = selectedSeats.includes(seat.number);
    
    if (seat.isBooked) {
      return 'bg-red-100 text-red-800 cursor-not-allowed border-2 border-red-200';
    }
    
    if (isSelected) {
      return 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-700';
    }
    
    switch (seat.type) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200 hover:shadow-md border-2 border-purple-200 hover:border-purple-300';
      case 'window':
        return 'bg-sky-100 text-sky-800 hover:bg-sky-200 hover:shadow-md border-2 border-sky-200 hover:border-sky-300';
      case 'aisle':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:shadow-md border-2 border-emerald-200 hover:border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md border-2 border-gray-200 hover:border-gray-300';
    }
  };

  const getSeatIcon = (seat: Seat) => {
    if (seat.isBooked) return '❌';
    if (seat.type === 'premium') return '👑';
    if (seat.type === 'window') return '🪟';
    if (seat.type === 'aisle') return '🚶';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Bus Layout Header */}
      <div className="text-center">
        <div className="inline-block bg-gray-800 text-white px-6 py-3 rounded-t-xl text-sm font-medium">
          🚌 Front of Bus (Driver)
        </div>
      </div>
      
      {/* Seat Grid */}
      <div className="max-w-md mx-auto">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-3">
            <div className="grid grid-cols-4 gap-2">
              {seats.slice(rowIndex * 4, (rowIndex + 1) * 4).map((seat) => (
                <div key={seat.number} className="relative">
                  <button
                    disabled={seat.isBooked}
                    onClick={() => handleSeatClick(seat.number)}
                    className={`
                      relative h-14 w-14 rounded-lg font-medium text-xs transition-all duration-200 shadow-sm
                      ${getSeatStyles(seat)}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-xs">{getSeatIcon(seat)}</span>
                      <span className="font-bold">{seat.number}</span>
                    </div>
                    
                    {selectedSeats.includes(seat.number) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                        {selectedSeats.indexOf(seat.number) + 1}
                      </span>
                    )}
                    
                    {seat.type === 'premium' && !seat.isBooked && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xs px-1 rounded">
                        +{(seat.price! / 1000)}k
                      </div>
                    )}
                  </button>
                  
                  {/* Add aisle space after seats 2 and 4 */}
                  {(seat.number === ((rowIndex + 1) * 4 - 2).toString()) && (
                    <div className="w-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Enhanced Legend */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Seat Types & Legend</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-purple-100 border-2 border-purple-200 rounded flex items-center justify-center">
              👑
            </div>
            <div>
              <div className="font-medium text-purple-800">Premium</div>
              <div className="text-xs text-gray-600">Extra legroom +15k</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-sky-100 border-2 border-sky-200 rounded flex items-center justify-center">
              🪟
            </div>
            <div>
              <div className="font-medium text-sky-800">Window</div>
              <div className="text-xs text-gray-600">Scenic view</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-emerald-100 border-2 border-emerald-200 rounded flex items-center justify-center">
              🚶
            </div>
            <div>
              <div className="font-medium text-emerald-800">Aisle</div>
              <div className="text-xs text-gray-600">Easy access</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-200 rounded flex items-center justify-center">
              ❌
            </div>
            <div>
              <div className="font-medium text-red-800">Booked</div>
              <div className="text-xs text-gray-600">Unavailable</div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>💺 Total Seats: {capacity}</span>
            <span>🚫 Booked: {bookedSeats.length}</span>
            <span>✅ Available: {capacity - bookedSeats.length}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-blue-600 font-medium">👥 Selected: {selectedSeats.length}/{maxSeats}</span>
            {selectedSeats.length >= maxSeats && (
              <span className="text-amber-600">Max seats reached</span>
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
              const seat = seats.find(s => s.number === seatNumber);
              const isPremium = seat?.type === 'premium';
              return (
                <div key={seatNumber} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-blue-200">
                  <span className="text-blue-600 font-medium">#{index + 1}</span>
                  <span className="font-medium">Seat {seatNumber}</span>
                  {isPremium && (
                    <span className="text-purple-600 text-xs">(Premium +15k)</span>
                  )}
                </div>
              );
            })}
          </div>
          {selectedSeats.some(seatNumber => seats.find(s => s.number === seatNumber)?.type === 'premium') && (
            <div className="text-center text-xs text-purple-600 mt-2">
              Premium seats include extra fees
            </div>
          )}
        </div>
      )}
    </div>
  );
}
