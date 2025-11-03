'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Clock, 
  DollarSign,
  Bus,
  Users,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Route {
  id: string;
  origin: string;
  destination: string;
  price: number;
  duration: string;
  departureTime: string;
  capacity: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function RouteManagement() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    price: '',
    duration: '',
    departureTime: '',
    capacity: '',
    description: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR') {
      router.push('/');
      return;
    }

    loadRoutes();
  }, [isAuthenticated, user, router]);

  const loadRoutes = async () => {
    try {
      // Mock data for demo - in real app, fetch from API
      setRoutes([
        {
          id: '1',
          origin: 'Kampala',
          destination: 'Jinja',
          price: 15000,
          duration: '2h 30m',
          departureTime: '08:00',
          capacity: 45,
          description: 'Express service to Jinja with AC',
          status: 'ACTIVE'
        },
        {
          id: '2',
          origin: 'Kampala',
          destination: 'Mbarara',
          price: 25000,
          duration: '4h 15m',
          departureTime: '09:00',
          capacity: 50,
          description: 'Luxury bus to Mbarara',
          status: 'ACTIVE'
        },
        {
          id: '3',
          origin: 'Entebbe',
          destination: 'Kampala',
          price: 12000,
          duration: '1h 30m',
          departureTime: '07:30',
          capacity: 40,
          description: 'Airport shuttle service',
          status: 'ACTIVE'
        },
        {
          id: '4',
          origin: 'Jinja',
          destination: 'Kampala',
          price: 15000,
          duration: '2h 45m',
          departureTime: '17:00',
          capacity: 45,
          description: 'Evening return service',
          status: 'ACTIVE'
        }
      ]);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const routeData = {
      id: editingRoute?.id || Date.now().toString(),
      origin: formData.origin,
      destination: formData.destination,
      price: parseInt(formData.price),
      duration: formData.duration,
      departureTime: formData.departureTime,
      capacity: parseInt(formData.capacity),
      description: formData.description,
      status: 'ACTIVE' as const
    };

    if (editingRoute) {
      setRoutes(routes.map(route => 
        route.id === editingRoute.id ? routeData : route
      ));
    } else {
      setRoutes([...routes, routeData]);
    }

    resetForm();
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      origin: route.origin,
      destination: route.destination,
      price: route.price.toString(),
      duration: route.duration,
      departureTime: route.departureTime,
      capacity: route.capacity.toString(),
      description: route.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      setRoutes(routes.filter(route => route.id !== routeId));
    }
  };

  const toggleStatus = (routeId: string) => {
    setRoutes(routes.map(route => 
      route.id === routeId 
        ? { ...route, status: route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : route
    ));
  };

  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      price: '',
      duration: '',
      departureTime: '',
      capacity: '',
      description: ''
    });
    setEditingRoute(null);
    setShowForm(false);
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'OPERATOR')) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
                <p className="text-gray-600">Manage your bus routes and schedules</p>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Route
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingRoute ? 'Edit Route' : 'Add New Route'}
                <Button variant="outline" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
                  <Input
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g., Kampala"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                  <Input
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g., Jinja"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (UGX)</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="15000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <Input
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="2h 30m"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                  <Input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="45"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Express service with AC, WiFi..."
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingRoute ? 'Update Route' : 'Add Route'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    {route.origin} → {route.destination}
                  </CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    route.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {route.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-semibold">UGX {route.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{route.duration}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Bus className="h-4 w-4 mr-1" />
                      Departs: {route.departureTime}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {route.capacity} seats
                    </div>
                  </div>

                  {route.description && (
                    <p className="text-sm text-gray-600 pt-2 border-t">
                      {route.description}
                    </p>
                  )}

                  <div className="flex justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(route.id)}
                      className={route.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'}
                    >
                      {route.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(route)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(route.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {routes.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Routes Available</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first bus route</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Route
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}