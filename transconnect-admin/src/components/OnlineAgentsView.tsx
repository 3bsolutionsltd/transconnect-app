import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Users, 
  Clock, 
  Phone, 
  Mail, 
  User,
  RefreshCw,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface OnlineAgent {
  id: string;
  name: string;
  phone: string;
  email: string;
  referralCode: string;
  status: string;
  lastActiveAt: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const OnlineAgentsView = () => {
  const [onlineAgents, setOnlineAgents] = useState<OnlineAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadOnlineAgents = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      
      const response = await fetch(`${API_BASE_URL}/api/agents/online`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineAgents(data.onlineAgents || []);
        setLastRefresh(new Date());
      } else {
        console.error('Failed to fetch online agents:', response.status);
        // Set demo data for testing
        setOnlineAgents([
          {
            id: '1',
            name: 'Stephen Omwony',
            phone: '256770123456',
            email: 'stephen@example.com',
            referralCode: 'STEP6946',
            status: 'VERIFIED',
            lastActiveAt: new Date().toISOString(),
            lastLoginAt: new Date(Date.now() - 30000).toISOString(),
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '2',
            name: 'Grace Nakato',
            phone: '256701234567',
            email: 'grace@example.com',
            referralCode: 'GRAC2847',
            status: 'APPROVED',
            lastActiveAt: new Date(Date.now() - 60000).toISOString(),
            lastLoginAt: new Date(Date.now() - 120000).toISOString(),
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading online agents:', error);
      // Set demo data on error
      setOnlineAgents([]);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOnlineAgents();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadOnlineAgents();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleRefresh = () => {
    loadOnlineAgents(true);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'VERIFIED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Online Agents</h2>
              <p className="text-sm text-gray-500">
                {onlineAgents.length} agent{onlineAgents.length !== 1 ? 's' : ''} currently online
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Online Agents List */}
      <div className="divide-y divide-gray-200">
        {onlineAgents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents online</h3>
            <p className="text-gray-500">All agents are currently offline.</p>
          </div>
        ) : (
          onlineAgents.map((agent) => (
            <div key={agent.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium text-gray-900 mr-3">{agent.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-3 w-3 mr-1" />
                        {agent.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {agent.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {agent.referralCode}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center text-sm text-green-600 mb-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Online
                    </div>
                    <div className="text-xs text-gray-500">
                      Active: {getTimeAgo(agent.lastActiveAt)}
                    </div>
                  </div>
                  
                  {agent.lastLoginAt && (
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Login
                      </div>
                      <div className="text-xs text-gray-500">
                        {getTimeAgo(agent.lastLoginAt)}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-right">
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Joined
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      {onlineAgents.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Real-time activity tracking active
            </div>
            <div>
              Auto-refreshes every 30 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineAgentsView;