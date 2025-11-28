import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bus, 
  Plus, 
  Edit3, 
  Users, 
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const OperatorBuses = () => {
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);

  const [busForm, setBusForm] = useState({
    plateNumber: '',
    model: '',
    capacity: '',
    amenities: ''
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const loadBuses = useCallback(async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/buses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBuses(data || []);
      }
    } catch (error) {
      console.error('Error loading buses:', error);
      // Fallback demo data
      setBuses([
        {
          id: '1',
          plateNumber: 'UBK 123A',
          model: 'Toyota Hiace',
          capacity: 14,
          amenities: 'AC, WiFi, USB Charging',
          active: true,
          routes: [
            { origin: 'Kampala', destination: 'Jinja' },
            { origin: 'Jinja', destination: 'Kampala' }
          ]
        },
        {
          id: '2',
          plateNumber: 'UBL 456B',
          model: 'Mercedes Sprinter',
          capacity: 18,
          amenities: 'AC, Entertainment System',
          active: true,
          routes: [
            { origin: 'Kampala', destination: 'Entebbe' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    loadBuses();
  }, [loadBuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingBus 
        ? `${API_BASE_URL}/buses/${editingBus.id}`
        : `${API_BASE_URL}/buses`;
      
      const response = await fetch(url, {
        method: editingBus ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...busForm,
          capacity: parseInt(busForm.capacity)
        })
      });

      if (response.ok) {
        loadBuses();
        setShowAddForm(false);
        setEditingBus(null);
        setBusForm({ plateNumber: '', model: '', capacity: '', amenities: '' });
      }
    } catch (error) {
      console.error('Error saving bus:', error);
    }
  };

  const startEdit = (bus: any) => {
    setEditingBus(bus);
    setBusForm({
      plateNumber: bus.plateNumber,
      model: bus.model,
      capacity: bus.capacity.toString(),
      amenities: bus.amenities || ''
    });
    setShowAddForm(true);
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingBus(null);
    setBusForm({ plateNumber: '', model: '', capacity: '', amenities: '' });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buses</h1>
          <p className="text-gray-600">Manage your bus fleet</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Bus
        </button>
      </div>

      {/* Add/Edit Bus Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow border border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingBus ? 'Edit Bus' : 'Add New Bus'}
            </h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600">
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={busForm.plateNumber}
                  onChange={(e) => setBusForm({...busForm, plateNumber: e.target.value})}
                  placeholder="e.g., UBK 123A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Model
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={busForm.model}
                  onChange={(e) => setBusForm({...busForm, model: e.target.value})}
                  placeholder="e.g., Toyota Hiace"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={busForm.capacity}
                  onChange={(e) => setBusForm({...busForm, capacity: e.target.value})}
                  placeholder="e.g., 14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={busForm.amenities}
                  onChange={(e) => setBusForm({...busForm, amenities: e.target.value})}
                  placeholder="e.g., AC, WiFi, USB Charging"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {editingBus ? 'Update Bus' : 'Add Bus'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bus List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {buses.map((bus) => (
          <div key={bus.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Bus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{bus.plateNumber}</h3>
                  <p className="text-gray-600">{bus.model}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {bus.active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="font-medium">{bus.capacity} seats</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Routes</p>
                <span className="font-medium">{bus.routes?.length || 0} routes</span>
              </div>
            </div>

            {bus.amenities && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Amenities</p>
                <p className="text-sm text-gray-700">{bus.amenities}</p>
              </div>
            )}

            {bus.routes && bus.routes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Routes</p>
                <div className="space-y-1">
                  {bus.routes.slice(0, 2).map((route: any, index: number) => (
                    <div key={index} className="text-sm bg-gray-50 px-2 py-1 rounded">
                      {route.origin} → {route.destination}
                    </div>
                  ))}
                  {bus.routes.length > 2 && (
                    <p className="text-xs text-gray-500">+{bus.routes.length - 2} more routes</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button 
                onClick={() => startEdit(bus)}
                className="flex items-center text-sm text-green-600 hover:text-green-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit Details
              </button>
              <button className="flex items-center text-sm text-gray-600 hover:text-gray-700 transition-colors">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </button>
            </div>
          </div>
        ))}

        {buses.length === 0 && (
          <div className="col-span-2 bg-white p-12 rounded-lg shadow text-center">
            <Bus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No buses registered</h3>
            <p className="text-gray-600 mb-4">
              Add your first bus to start managing your fleet
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Bus
            </button>
          </div>
        )}
      </div>

      {/* Fleet Summary */}
      {buses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-2">Fleet Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-green-700">Total Buses</p>
              <p className="text-2xl font-bold text-green-900">{buses.length}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Active Buses</p>
              <p className="text-2xl font-bold text-green-900">
                {buses.filter(bus => bus.active).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Total Capacity</p>
              <p className="text-2xl font-bold text-green-900">
                {buses.reduce((sum, bus) => sum + bus.capacity, 0)} seats
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorBuses;