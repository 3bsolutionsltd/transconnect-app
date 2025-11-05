import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bus,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Settings,
  AlertTriangle,
  Car
} from 'lucide-react';

interface Operator {
  id: string;
  companyName: string;
  license: string;
  approved: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  buses: Bus[];
  routes: any[];
}

interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  amenities: string;
  operatorId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const OperatorManagement: React.FC = () => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddOperatorModal, setShowAddOperatorModal] = useState(false);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [editingBus, setBus] = useState<Bus | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [activeTab, setActiveTab] = useState('operators');

  const [operatorFormData, setOperatorFormData] = useState({
    companyName: '',
    license: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    approved: false
  });

  const [busFormData, setBusFormData] = useState({
    plateNumber: '',
    model: '',
    capacity: '',
    amenities: '',
    operatorId: '',
    active: true
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://transconnect-app-44ie.onrender.com/api';

  useEffect(() => {
    fetchOperators();
    fetchBuses();
  }, []);

  const fetchOperators = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operators`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOperators(data);
      }
    } catch (error) {
      console.error('Error fetching operators:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
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
        setBuses(data);
      }
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingOperator 
        ? `${API_BASE_URL}/operators/${editingOperator.id}`
        : `${API_BASE_URL}/operators`;
      
      const method = editingOperator ? 'PUT' : 'POST';
      
      // Convert firstName + lastName to contactPerson for current backend API
      const submissionData = {
        ...operatorFormData,
        contactPerson: `${operatorFormData.firstName} ${operatorFormData.lastName}`.trim()
      };
      
      // Remove firstName and lastName since backend expects contactPerson
      delete submissionData.firstName;
      delete submissionData.lastName;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        await fetchOperators();
        resetOperatorForm();
        setShowAddOperatorModal(false);
      } else {
        const error = await response.json();
        console.error('Error saving operator:', error);
        alert(error.error || 'Failed to save operator');
      }
    } catch (error) {
      console.error('Error saving operator:', error);
      alert('Failed to save operator');
    }
  };

  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingBus 
        ? `${API_BASE_URL}/buses/${editingBus.id}`
        : `${API_BASE_URL}/buses`;
      
      const method = editingBus ? 'PUT' : 'POST';
      
      const busData = {
        ...busFormData,
        capacity: parseInt(busFormData.capacity)
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(busData)
      });

      if (response.ok) {
        await fetchBuses();
        resetBusForm();
        setShowAddBusModal(false);
      } else {
        const error = await response.json();
        console.error('Error saving bus:', error);
        alert(error.error || 'Failed to save bus');
      }
    } catch (error) {
      console.error('Error saving bus:', error);
      alert('Failed to save bus');
    }
  };

  const toggleOperatorApproval = async (operatorId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operators/${operatorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ approved: !currentStatus })
      });

      if (response.ok) {
        await fetchOperators();
      }
    } catch (error) {
      console.error('Error updating operator approval:', error);
    }
  };

  const deleteOperator = async (operatorId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this operator? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/operators/${operatorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchOperators();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete operator');
      }
    } catch (error) {
      console.error('Error deleting operator:', error);
      alert('Failed to delete operator');
    }
  };

  const deleteBus = async (busId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this bus? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchBuses();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete bus');
      }
    } catch (error) {
      console.error('Error deleting bus:', error);
      alert('Failed to delete bus');
    }
  };

  const resetOperatorForm = () => {
    setOperatorFormData({
      companyName: '',
      license: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      approved: false
    });
    setEditingOperator(null);
  };

  const resetBusForm = () => {
    setBusFormData({
      plateNumber: '',
      model: '',
      capacity: '',
      amenities: '',
      operatorId: '',
      active: true
    });
    setBus(null);
  };

  const startEditOperator = (operator: Operator) => {
    setEditingOperator(operator);
    setOperatorFormData({
      companyName: operator.companyName,
      license: operator.license,
      firstName: operator.user.firstName,
      lastName: operator.user.lastName,
      email: operator.user.email,
      phone: operator.user.phone,
      password: '',
      approved: operator.approved
    });
    setShowAddOperatorModal(true);
  };

  const startEditBus = (bus: Bus) => {
    setBus(bus);
    setBusFormData({
      plateNumber: bus.plateNumber,
      model: bus.model,
      capacity: bus.capacity.toString(),
      amenities: bus.amenities || '',
      operatorId: bus.operatorId,
      active: bus.active
    });
    setShowAddBusModal(true);
  };

  const filteredOperators = operators.filter(operator => {
    const matchesSearch = 
      operator.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.license.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operator.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'approved' && operator.approved) ||
      (filterStatus === 'pending' && !operator.approved);
    
    return matchesSearch && matchesFilter;
  });

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = 
      bus.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperator = 
      !selectedOperator || bus.operatorId === selectedOperator;
    
    return matchesSearch && matchesOperator;
  });

  const getOperatorStats = () => {
    const total = operators.length;
    const approved = operators.filter(op => op.approved).length;
    const pending = total - approved;
    const totalBuses = buses.length;
    const activeBuses = buses.filter(bus => bus.active).length;

    return { total, approved, pending, totalBuses, activeBuses };
  };

  const stats = getOperatorStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 space-y-3">
                <div className="h-12 w-12 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Operator & Bus Management</h1>
          <p className="text-gray-600">Manage bus operators and their fleet</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              resetOperatorForm();
              setShowAddOperatorModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Operator
          </button>
          <button
            onClick={() => {
              resetBusForm();
              setShowAddBusModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bus
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Operators</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Buses</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalBuses}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Buses</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeBuses}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('operators')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operators'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Operators ({operators.length})
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'buses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bus className="h-4 w-4 inline mr-2" />
            Buses ({buses.length})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {activeTab === 'operators' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
            </select>
          )}

          {activeTab === 'buses' && (
            <select
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Operators</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.companyName}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'operators' ? (
        // Operators Table
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fleet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{operator.companyName}</div>
                        <div className="text-sm text-gray-600">
                          Created {new Date(operator.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {operator.user.firstName} {operator.user.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{operator.user.email}</div>
                        <div className="text-sm text-gray-600">{operator.user.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {operator.license}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleOperatorApproval(operator.id, operator.approved)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          operator.approved
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                        }`}
                      >
                        {operator.approved ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {operator.buses?.length || 0} buses
                      </div>
                      <div className="text-sm text-gray-600">
                        {operator.routes?.length || 0} routes
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditOperator(operator)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title="Edit operator"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteOperator(operator.id)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title="Delete operator"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Buses Table
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bus Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amenities
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuses.map((bus) => {
                  const operator = operators.find(op => op.id === bus.operatorId);
                  return (
                    <tr key={bus.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{bus.plateNumber}</div>
                          <div className="text-sm text-gray-600">{bus.model}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {operator?.companyName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{bus.capacity} seats</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {bus.amenities || 'None specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bus.active
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {bus.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditBus(bus)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Edit bus"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteBus(bus.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                            title="Delete bus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Operator Modal */}
      {showAddOperatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingOperator ? 'Edit Operator' : 'Add New Operator'}
              </h3>
            </div>
            
            <form onSubmit={handleOperatorSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={operatorFormData.companyName}
                    onChange={(e) => setOperatorFormData({...operatorFormData, companyName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={operatorFormData.license}
                    onChange={(e) => setOperatorFormData({...operatorFormData, license: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={operatorFormData.firstName}
                    onChange={(e) => setOperatorFormData({...operatorFormData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={operatorFormData.lastName}
                    onChange={(e) => setOperatorFormData({...operatorFormData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={operatorFormData.email}
                    onChange={(e) => setOperatorFormData({...operatorFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={operatorFormData.phone}
                    onChange={(e) => setOperatorFormData({...operatorFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {!editingOperator && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={operatorFormData.password}
                    onChange={(e) => setOperatorFormData({...operatorFormData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!editingOperator}
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="approved"
                  checked={operatorFormData.approved}
                  onChange={(e) => setOperatorFormData({...operatorFormData, approved: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="approved" className="ml-2 block text-sm text-gray-900">
                  Approve operator immediately
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddOperatorModal(false);
                    resetOperatorForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingOperator ? 'Update Operator' : 'Add Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Bus Modal */}
      {showAddBusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h3>
            </div>
            
            <form onSubmit={handleBusSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator
                </label>
                <select
                  value={busFormData.operatorId}
                  onChange={(e) => setBusFormData({...busFormData, operatorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Operator</option>
                  {operators.filter(op => op.approved).map((operator) => (
                    <option key={operator.id} value={operator.id}>
                      {operator.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number
                </label>
                <input
                  type="text"
                  value={busFormData.plateNumber}
                  onChange={(e) => setBusFormData({...busFormData, plateNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={busFormData.model}
                  onChange={(e) => setBusFormData({...busFormData, model: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (seats)
                </label>
                <input
                  type="number"
                  value={busFormData.capacity}
                  onChange={(e) => setBusFormData({...busFormData, capacity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amenities
                </label>
                <textarea
                  value={busFormData.amenities}
                  onChange={(e) => setBusFormData({...busFormData, amenities: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., AC, WiFi, Charging ports"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="busActive"
                  checked={busFormData.active}
                  onChange={(e) => setBusFormData({...busFormData, active: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="busActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBusModal(false);
                    resetBusForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingBus ? 'Update Bus' : 'Add Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorManagement;