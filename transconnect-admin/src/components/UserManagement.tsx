import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Eye,
  Trash2,
  Download,
  UserPlus,
  Building,
  Settings,
  Plus
} from 'lucide-react';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'PASSENGER' | 'OPERATOR' | 'ADMIN';
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
  bookingsCount?: number;
}

interface OperatorUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  verified: boolean;
  operatorRole: 'MANAGER' | 'DRIVER' | 'CONDUCTOR' | 'TICKETER' | 'MAINTENANCE';
  active: boolean;
  createdAt: string;
  operator?: {
    id: string;
    companyName: string;
    approved: boolean;
  };
}

interface Operator {
  id: string;
  companyName: string;
  approved: boolean;
}

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'operator-users'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [operatorUsers, setOperatorUsers] = useState<OperatorUser[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreateOperatorUserModal, setShowCreateOperatorUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedOperatorUser, setSelectedOperatorUser] = useState<OperatorUser | null>(null);
  const [createOperatorUserForm, setCreateOperatorUserForm] = useState({
    operatorId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TICKETER' as 'MANAGER' | 'DRIVER' | 'CONDUCTOR' | 'TICKETER' | 'MAINTENANCE'
  });

  useEffect(() => {
    console.log('UserManagement: Component mounted, fetching data...');
    fetchUsers();
    fetchOperatorUsers();
    fetchOperators();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('UserManagement: Starting fetchUsers...');
      
      // Check if token exists
      const token = localStorage.getItem('admin_token');
      console.log('UserManagement: Token exists:', !!token);
      
      if (!token) {
        console.log('UserManagement: No token found, redirecting to login');
        window.location.href = '/';
        return;
      }
      
      const response = await api.get('/users');
      console.log('UserManagement: API response received:', response);
      
      // Handle both direct array response and wrapped response
      const usersData = Array.isArray(response) ? response : (response.data || response);
      console.log('UserManagement: Processed users data:', {
        isArray: Array.isArray(usersData),
        length: Array.isArray(usersData) ? usersData.length : 'N/A',
        sample: Array.isArray(usersData) && usersData[0] ? {
          id: usersData[0].id?.substring(0, 8),
          name: `${usersData[0].firstName} ${usersData[0].lastName}`,
          email: usersData[0].email,
          role: usersData[0].role
        } : 'No sample available'
      });
      
      // Ensure we always set an array, even if the response is unexpected
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else {
        console.error('UserManagement: Response is not an array, setting empty array');
        setUsers([]);
      }
      console.log('UserManagement: Users state updated successfully');
    } catch (error: any) {
      console.error('UserManagement: Error fetching users:', {
        message: error.message,
        status: error.status,
        response: error.response,
        stack: error.stack
      });
      
      // Always ensure users is an array even on error
      setUsers([]);
      
      // More detailed error handling
      if (error.status === 403) {
        alert('Access denied. Admin privileges required.');
      } else if (error.status === 401) {
        alert('Authentication failed. Please log in again.');
        // Clear invalid token and reload page
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.reload();
      } else {
        const errorMessage = error.message || error.toString() || 'Unknown error';
        alert(`Failed to load users: ${errorMessage}. Check console for details.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOperatorUsers = async () => {
    try {
      const response = await api.get('/admin/operator-users/all');
      const operatorUsersData = Array.isArray(response) ? response : (response.users || response.data || []);
      setOperatorUsers(operatorUsersData);
    } catch (error: any) {
      console.error('Error fetching operator users:', error);
      setOperatorUsers([]);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await api.get('/operators');
      const operatorsData = Array.isArray(response) ? response : (response.data || []);
      setOperators(operatorsData);
    } catch (error: any) {
      console.error('Error fetching operators:', error);
      setOperators([]);
    }
  };

  const handleUserAction = async (userId: string, action: 'verify' | 'unverify' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        await api.delete(`/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId));
        alert('User deleted successfully');
      } else {
        const verified = action === 'verify';
        const user = users.find(u => u.id === userId);
        if (!user) return;

        await api.put(`/users/${userId}`, {
          ...user,
          verified
        });

        setUsers(users.map(u => 
          u.id === userId ? { ...u, verified } : u
        ));
        alert(`User ${verified ? 'verified' : 'unverified'} successfully`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleBulkAction = async (action: 'verify' | 'unverify' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    if (action === 'delete') {
      if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    }

    for (const userId of selectedUsers) {
      await handleUserAction(userId, action);
    }
    
    setSelectedUsers([]);
  };

  const handleCreateOperatorUser = async () => {
    try {
      if (!createOperatorUserForm.operatorId || !createOperatorUserForm.firstName || 
          !createOperatorUserForm.lastName || !createOperatorUserForm.email || 
          !createOperatorUserForm.phone || !createOperatorUserForm.password) {
        alert('Please fill in all required fields');
        return;
      }

      await api.post('/admin/operator-users/create', createOperatorUserForm);
      alert('Operator user created successfully');
      
      // Reset form and close modal
      setCreateOperatorUserForm({
        operatorId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'TICKETER'
      });
      setShowCreateOperatorUserModal(false);
      
      // Refresh data
      fetchOperatorUsers();
    } catch (error: any) {
      console.error('Error creating operator user:', error);
      alert(`Failed to create operator user: ${error.message || 'Unknown error'}`);
    }
  };

  const handleOperatorUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to delete this operator user?')) return;
        
        await api.delete(`/admin/operator-users/${userId}`);
        setOperatorUsers(operatorUsers.filter(u => u.userId !== userId));
        alert('Operator user deleted successfully');
      } else {
        const active = action === 'activate';
        const operatorUser = operatorUsers.find(u => u.userId === userId);
        if (!operatorUser) return;

        await api.put(`/admin/operator-users/${userId}`, {
          active
        });

        setOperatorUsers(operatorUsers.map(u => 
          u.userId === userId ? { ...u, active } : u
        ));
        alert(`Operator user ${active ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error: any) {
      console.error('Error updating operator user:', error);
      alert(`Failed to update operator user: ${error.message || 'Unknown error'}`);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Role', 'Verified', 'Bookings', 'Created At'],
      ...filteredUsers.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.phone,
        user.role,
        user.verified ? 'Yes' : 'No',
        user.bookingsCount?.toString() || '0',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transconnect-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Ensure arrays are always arrays before filtering
  const safeUsers = Array.isArray(users) ? users : [];
  const safeOperatorUsers = Array.isArray(operatorUsers) ? operatorUsers : [];
  
  const filteredUsers = safeUsers.filter(user => {
    const matchesSearch = 
      (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm);
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'VERIFIED' && user.verified) ||
      (statusFilter === 'UNVERIFIED' && !user.verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredOperatorUsers = safeOperatorUsers.filter(user => {
    const matchesSearch = 
      (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm);
    
    const matchesRole = roleFilter === 'ALL' || user.operatorRole === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && user.active) ||
      (statusFilter === 'INACTIVE' && !user.active);

    const matchesOperator = operatorFilter === 'ALL' || user.operator?.id === operatorFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesOperator;
  });

  const userStats = {
    total: safeUsers.length,
    admins: safeUsers.filter(u => u.role === 'ADMIN').length,
    operators: safeUsers.filter(u => u.role === 'OPERATOR').length,
    passengers: safeUsers.filter(u => u.role === 'PASSENGER').length,
    verified: safeUsers.filter(u => u.verified).length,
    unverified: safeUsers.filter(u => !u.verified).length
  };

  const operatorUserStats = {
    total: safeOperatorUsers.length,
    managers: safeOperatorUsers.filter(u => u.operatorRole === 'MANAGER').length,
    drivers: safeOperatorUsers.filter(u => u.operatorRole === 'DRIVER').length,
    conductors: safeOperatorUsers.filter(u => u.operatorRole === 'CONDUCTOR').length,
    ticketers: safeOperatorUsers.filter(u => u.operatorRole === 'TICKETER').length,
    maintenance: safeOperatorUsers.filter(u => u.operatorRole === 'MAINTENANCE').length,
    active: safeOperatorUsers.filter(u => u.active).length,
    inactive: safeOperatorUsers.filter(u => !u.active).length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'OPERATOR': return 'bg-blue-100 text-blue-800';
      case 'PASSENGER': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperatorRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'DRIVER': return 'bg-blue-100 text-blue-800';
      case 'CONDUCTOR': return 'bg-green-100 text-green-800';
      case 'TICKETER': return 'bg-orange-100 text-orange-800';
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  // Add error boundary for when users array is not properly set
  if (!Array.isArray(users)) {
    console.error('UserManagement: users is not an array:', users);
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Users className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error Loading Users</h3>
            <p className="text-sm text-gray-600 mt-2">
              There was a problem loading the user data. Please refresh the page.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users and operator staff</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'operator-users' && (
            <button
              onClick={() => setShowCreateOperatorUserModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Operator User</span>
            </button>
          )}
          <button
            onClick={exportUsers}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('users');
              setSearchTerm('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Platform Users</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {userStats.total}
              </span>
            </div>
          </button>
          <button
            onClick={() => {
              setActiveTab('operator-users');
              setSearchTerm('');
              setRoleFilter('ALL');
              setStatusFilter('ALL');
              setOperatorFilter('ALL');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operator-users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>Operator Staff</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                {operatorUserStats.total}
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      {activeTab === 'users' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Admins</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Operators</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.operators}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Passengers</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.passengers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Verified</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.verified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Unverified</p>
                <p className="text-xl font-semibold text-gray-900">{userStats.unverified}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Staff</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Managers</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.managers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Drivers</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.drivers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Conductors</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.conductors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Ticketers</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.ticketers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Inactive</p>
                <p className="text-xl font-semibold text-gray-900">{operatorUserStats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="PASSENGER">Passenger</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedUsers.length} users selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('verify')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Verify
              </button>
              <button
                onClick={() => handleBulkAction('unverify')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
              >
                Unverify
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {(user.firstName || '?')[0]}{(user.lastName || '?')[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                      <div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.verified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Joined {formatDate(user.createdAt)}
                      </div>
                      {user.lastLogin && (
                        <div className="mt-1">
                          Last seen {getTimeAgo(user.lastLogin)}
                        </div>
                      )}
                      {user.role === 'PASSENGER' && (
                        <div className="mt-1">
                          {user.bookingsCount} bookings
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, user.verified ? 'unverify' : 'verify')}
                        className={`p-2 rounded-md transition-colors ${
                          user.verified 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={user.verified ? 'Unverify user' : 'Verify user'}
                      >
                        {user.verified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete user"
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' 
                ? 'Try adjusting your search filters' 
                : 'No users have registered yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-blue-600">
                    {(selectedUser.firstName || '?')[0]}{(selectedUser.lastName || '?')[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedUser.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
                {selectedUser.lastLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-sm text-gray-900">{getTimeAgo(selectedUser.lastLogin)}</p>
                  </div>
                )}
                {selectedUser.role === 'PASSENGER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Bookings</label>
                    <p className="text-sm text-gray-900">{selectedUser.bookingsCount || 0}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleUserAction(selectedUser.id, selectedUser.verified ? 'unverify' : 'verify');
                    setShowUserModal(false);
                  }}
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    selectedUser.verified 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {selectedUser.verified ? 'Unverify User' : 'Verify User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;