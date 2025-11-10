'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DurationInput from '@/components/ui/DurationInput';
import { formatDuration, formatDurationShort } from '@/lib/durationUtils';
import { Clock, Plus, Edit } from 'lucide-react';

export default function RouteFormDemo() {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    distance: '',
    duration: 0, // Duration in minutes
    price: '',
    departureTime: ''
  });

  const [savedRoutes, setSavedRoutes] = useState([
    { id: 1, origin: 'Kampala', destination: 'Mbarara', duration: 270, distance: 270 }, // 4h 30m
    { id: 2, origin: 'Kampala', destination: 'Jinja', duration: 90, distance: 80 },    // 1h 30m
    { id: 3, origin: 'Entebbe', destination: 'Kampala', duration: 60, distance: 40 },  // 1h
  ]);

  const handleDurationChange = (minutes: number) => {
    setFormData(prev => ({ ...prev, duration: minutes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Route form submitted:', formData);
    
    // Simulate adding a new route
    if (formData.origin && formData.destination && formData.duration > 0) {
      const newRoute = {
        id: savedRoutes.length + 1,
        origin: formData.origin,
        destination: formData.destination,
        duration: formData.duration,
        distance: parseFloat(formData.distance) || 0
      };
      setSavedRoutes(prev => [...prev, newRoute]);
      
      // Reset form
      setFormData({
        origin: '',
        destination: '',
        distance: '',
        duration: 0,
        price: '',
        departureTime: ''
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Route Duration Input Demo</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Enhanced duration input with hours and minutes support for route management
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Route Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Add New Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Origin *
                    </label>
                    <input
                      type="text"
                      value={formData.origin}
                      onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
                      className="form-input w-full"
                      placeholder="e.g., Kampala"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination *
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                      className="form-input w-full"
                      placeholder="e.g., Mbarara"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      value={formData.distance}
                      onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                      className="form-input w-full"
                      placeholder="270"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (UGX)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="form-input w-full"
                      placeholder="25000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Enhanced Duration Input */}
                <DurationInput
                  value={formData.duration}
                  onChange={handleDurationChange}
                  label="Journey Duration"
                  placeholder="Enter the expected travel time from origin to destination"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="form-input w-full"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Route
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2 text-green-600" />
                Existing Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedRoutes.map((route) => (
                  <div key={route.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {route.origin} → {route.destination}
                      </div>
                      <span className="text-sm text-gray-500">#{route.id}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Distance:</span> {route.distance}km
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {formatDurationShort(route.duration)}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-green-600 bg-green-50 rounded px-2 py-1 inline-block">
                      Full Duration: {formatDuration(route.duration)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Duration Format Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Duration Format Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">✅ NEW: Hours + Minutes</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• <span className="font-mono">1h 30m</span> (90 minutes)</li>
                  <li>• <span className="font-mono">4h 30m</span> (270 minutes)</li>
                  <li>• <span className="font-mono">2h</span> (120 minutes)</li>
                  <li>• <span className="font-mono">45m</span> (45 minutes)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-3">❌ OLD: Minutes Only</h4>
                <ul className="space-y-2 text-sm text-red-700">
                  <li>• <span className="font-mono">90 mins</span> (confusing)</li>
                  <li>• <span className="font-mono">270 mins</span> (hard to read)</li>
                  <li>• <span className="font-mono">120 mins</span> (not intuitive)</li>
                  <li>• <span className="font-mono">45 mins</span> (okay for short)</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">🎯 User Benefits</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li>• Intuitive input format</li>
                  <li>• Automatic validation</li>
                  <li>• Real-time conversion</li>
                  <li>• Consistent display</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Notes */}
        <div className="mt-8 bg-gray-100 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🛠️ Integration Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">For Admin Forms:</h4>
              <ul className="space-y-1">
                <li>• Use <code className="bg-gray-200 px-1 rounded">DurationInput</code> component</li>
                <li>• Stores duration as total minutes (backend compatible)</li>
                <li>• Validates hours (0-24) and minutes (0-59)</li>
                <li>• Auto-adjusts overflow (65 mins → 1h 5m)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Display:</h4>
              <ul className="space-y-1">
                <li>• Use <code className="bg-gray-200 px-1 rounded">formatDurationShort()</code> for listings</li>
                <li>• Use <code className="bg-gray-200 px-1 rounded">formatDuration()</code> for details</li>
                <li>• Backend continues using minutes (no changes needed)</li>
                <li>• Consistent formatting across all pages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}