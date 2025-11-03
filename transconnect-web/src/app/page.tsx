'use client';
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bus, MapPin, Clock, Shield, Search, Car, Building, Compass, Users } from 'lucide-react'
import Header from '@/components/Header'
import { useState } from 'react'

export default function HomePage() {
  const [currentLocation, setCurrentLocation] = useState('Current Location');
  const [destination, setDestination] = useState('');
  const [activeMode, setActiveMode] = useState('Intercity');

  const suggestions = [
    { icon: Bus, text: "Bus to Gulu leaving in 20 mins", type: "bus", action: () => window.location.href = '/search?destination=Gulu' },
    { icon: Car, text: "Ride to Garden City — 12 mins away", type: "ride", action: () => window.location.href = '/search?destination=Garden City' },
    { icon: Building, text: "Hotels near Jinja Terminal", type: "hotel", action: () => window.location.href = '/search?destination=Jinja' }
  ];

  const smartModes = [
    { id: 'Intercity', label: 'Intercity', icon: Bus },
    { id: 'Local Ride', label: 'Local Ride', icon: Car },
    { id: 'Stay', label: 'Stay', icon: Building },
    { id: 'Explore', label: 'Explore', icon: Compass }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <Header />
      
      {/* Main Content */}
      <div className="pt-4 pb-16 px-4 sm:pt-8">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight px-2">
              Your One-Stop<br />
              Transport Hub in East Africa
            </h1>
          </div>

          {/* Search Card */}
          <Card className="mb-6 sm:mb-8 shadow-2xl mx-2 sm:mx-0">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center sm:text-left">
                Where are you headed?
              </h2>
              
              {/* Search Form - Mobile First */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Current Location"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter destination..."
                  />
                </div>
                <Button 
                  className="w-full py-3 sm:py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
                  onClick={() => {
                    if (destination) {
                      window.location.href = `/search?destination=${encodeURIComponent(destination)}&origin=${encodeURIComponent(currentLocation)}`;
                    } else {
                      window.location.href = '/search';
                    }
                  }}
                >
                  Search
                </Button>
              </div>

              {/* Suggestions */}
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">Suggestions:</h3>
                <div className="space-y-2 sm:space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 cursor-pointer transition-colors p-3 sm:p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 min-h-[44px] touch-manipulation"
                      onClick={suggestion.action}
                    >
                      <suggestion.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm sm:text-base">{suggestion.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Mode */}
              <div>
                <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3 sm:mb-4">Smart Mode</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {smartModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      className={`p-3 sm:p-4 rounded-xl text-center transition-all touch-manipulation min-h-[60px] sm:min-h-auto ${
                        activeMode === mode.id
                          ? 'bg-blue-900 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                      }`}
                    >
                      <mode.icon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2" />
                      <div className="text-xs sm:text-sm font-medium">{mode.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Trip Card */}
          <Card className="mb-6 sm:mb-8 bg-blue-900 text-white shadow-2xl cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] transition-all mx-2 sm:mx-0 touch-manipulation" onClick={() => window.location.href = '/search?destination=Gulu'}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    Bus to Gulu<br />
                    leaving in 20 mins
                  </h3>
                  <div className="bg-blue-700 bg-opacity-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm">5 nearby drivers available</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 mb-2">
                    <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-300 mx-auto" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">5 nearby<br />drivers</div>
                  <div className="text-xs opacity-75">av at J SX 60,000</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why TransConnect */}
          <div className="text-center px-2 sm:px-0">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Why TransConnect</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Book Anytime</h4>
                <p className="text-blue-100 text-sm">24/7 booking with instant confirmation and digital tickets</p>
              </div>
              <div className="text-center">
                <div className="bg-white bg-opacity-10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Secure Digital</h4>
                <p className="text-blue-100 text-sm">Safe payments and QR code tickets for contactless travel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-950 text-white py-6 sm:py-8 border-t border-blue-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Bus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            <span className="ml-2 text-base sm:text-lg font-semibold">TransConnect</span>
          </div>
          <p className="text-blue-200 mb-4 text-sm sm:text-base">
            Connecting East Africa through smart transportation solutions
          </p>
          <p className="text-xs sm:text-sm text-blue-300">
            © 2024 TransConnect. Built by 3B Solutions Ltd & Green Rokon Technologies Ltd.
          </p>
        </div>
      </footer>
    </div>
  )
}