'use client';
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bus, MapPin, Clock, Shield, Search, Car, Building, Compass, Users, Smartphone, CreditCard } from 'lucide-react'
import Header from '@/components/Header'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [activeMode, setActiveMode] = useState('Intercity');

  const today = new Date().toISOString().split('T')[0];

  function handleSearch() {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (origin) params.set('origin', origin);
    if (travelDate) params.set('date', travelDate);
    router.push(`/search?${params.toString()}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  const smartModes = [
    {
      id: 'Intercity',
      label: 'Intercity',
      icon: Bus,
      placeholder: 'e.g. Kampala → Gulu',
      description: 'Book long-distance bus tickets'
    },
    {
      id: 'Local Ride',
      label: 'Local Ride',
      icon: Car,
      placeholder: 'e.g. Garden City',
      description: 'Find a shared ride nearby'
    },
    {
      id: 'Stay',
      label: 'Stay',
      icon: Building,
      placeholder: 'e.g. Jinja',
      description: 'Hotels near bus terminals'
    },
    {
      id: 'Explore',
      label: 'Explore',
      icon: Compass,
      placeholder: 'e.g. Bwindi',
      description: 'Discover destinations'
    },
  ];

  const activeModeMeta = smartModes.find(m => m.id === activeMode)!;

  const suggestions = [
    { icon: Bus, text: 'Kampala → Gulu', sub: 'Intercity bus', dest: 'Gulu', orig: 'Kampala' },
    { icon: Bus, text: 'Kampala → Jinja', sub: 'Intercity bus', dest: 'Jinja', orig: 'Kampala' },
    { icon: Bus, text: 'Kampala → Mbarara', sub: 'Intercity bus', dest: 'Mbarara', orig: 'Kampala' },
  ];

  const whyItems = [
    {
      icon: Clock,
      title: 'Book Anytime',
      desc: '24/7 booking with instant confirmation and digital tickets'
    },
    {
      icon: Shield,
      title: 'Secure Digital',
      desc: 'Safe payments and QR code tickets for contactless travel'
    },
    {
      icon: CreditCard,
      title: 'Mobile Money',
      desc: 'Pay with MTN MoMo or Airtel Money — no cash needed'
    },
    {
      icon: Smartphone,
      title: 'Ticket on Your Phone',
      desc: 'Your QR ticket lives on your phone, even offline'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <Header />

      {/* Main Content */}
      <div className="pt-4 pb-16 px-4 sm:pt-8">
        <div className="max-w-2xl mx-auto">

          {/* Hero */}
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

              {/* Smart Mode Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {smartModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`p-3 rounded-xl text-center transition-all touch-manipulation min-h-[60px] ${
                      activeMode === mode.id
                        ? 'bg-blue-900 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    <mode.icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-medium leading-tight">{mode.label}</div>
                  </button>
                ))}
              </div>

              {activeMode !== 'Intercity' && (
                <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mb-4">
                  {activeModeMeta.description}
                </p>
              )}

              {/* Search Form */}
              <div className="space-y-3 mb-6">
                {activeMode === 'Intercity' && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      placeholder="From (e.g. Kampala)"
                    />
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder={activeModeMeta.placeholder}
                  />
                </div>
                {activeMode === 'Intercity' && (
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="date"
                      value={travelDate}
                      min={today}
                      onChange={(e) => setTravelDate(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base text-gray-700"
                    />
                  </div>
                )}
                <Button
                  className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>

              {/* Popular Routes */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Popular routes</h3>
                <div className="space-y-2">
                  {suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-colors touch-manipulation min-h-[44px]"
                      onClick={() => {
                        const params = new URLSearchParams({ destination: s.dest, origin: s.orig });
                        if (travelDate) params.set('date', travelDate);
                        router.push(`/search?${params.toString()}`);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <s.icon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{s.text}</div>
                          <div className="text-xs text-gray-500">{s.sub}</div>
                        </div>
                      </div>
                      <span className="text-blue-500 text-xs font-medium">Search →</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why TransConnect */}
          <div className="text-center px-2 sm:px-0 mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">Why TransConnect</h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {whyItems.map((item) => (
                <div key={item.title} className="text-center">
                  <div className="bg-white bg-opacity-10 rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-blue-200 text-xs sm:text-sm">{item.desc}</p>
                </div>
              ))}
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
            © 2026 TransConnect. Built by 3B Solutions Ltd & Green Rokon Technologies Ltd.
          </p>
        </div>
      </footer>
    </div>
  )
}