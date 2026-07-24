import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, Phone, Search, ShieldCheck, Globe, UserCheck } from 'lucide-react';

interface FieldOperatorEntry {
  id: string;
  companyName: string;
  license: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: {
    approved: boolean;
    portalEnabled: boolean;
    managedByAgent: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const FieldOperatorDirectory: React.FC = () => {
  const [operators, setOperators] = useState<FieldOperatorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/api';

  useEffect(() => {
    const loadOperators = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/operators/field-ops/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(responseText || 'Failed to load operator directory');
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data.operators || [];
        setOperators(list);
      } catch (loadError: any) {
        console.error('Error loading field operator directory:', loadError);
        setError(loadError?.message || 'Failed to load operator directory');
      } finally {
        setLoading(false);
      }
    };

    loadOperators();
  }, [API_BASE_URL]);

  const filteredOperators = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return operators;
    }

    return operators.filter((operator) => {
      const fields = [
        operator.companyName,
        operator.license,
        operator.contact?.name,
        operator.contact?.email,
        operator.contact?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return fields.includes(term);
    });
  }, [operators, searchTerm]);

  const approvedCount = operators.filter((operator) => operator.status?.approved).length;
  const portalEnabledCount = operators.filter((operator) => operator.status?.portalEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Operator Directory</h1>
          <p className="text-gray-600">View operator company, contact, and operational status.</p>
        </div>
        <div className="text-sm text-gray-500">{filteredOperators.length} operators shown</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Operators</p>
              <p className="text-2xl font-bold text-gray-900">{operators.length}</p>
            </div>
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            </div>
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Portal Enabled</p>
              <p className="text-2xl font-bold text-gray-900">{portalEnabledCount}</p>
            </div>
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search company, contact, phone, email, or license"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading operator directory...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : filteredOperators.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No operators found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{operator.companyName}</div>
                      <div className="text-xs text-gray-500">License: {operator.license}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{operator.contact?.name || 'N/A'}</div>
                      <div className="mt-1 flex items-center text-xs text-gray-600">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {operator.contact?.email || 'N/A'}
                      </div>
                      <div className="mt-1 flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {operator.contact?.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${operator.status?.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {operator.status?.approved ? 'Approved' : 'Pending Approval'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${operator.status?.portalEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                          {operator.status?.portalEnabled ? 'Portal On' : 'Portal Off'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${operator.status?.managedByAgent ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {operator.status?.managedByAgent ? 'Agent Managed' : 'Platform Managed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(operator.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 flex items-center">
        <UserCheck className="h-3 w-3 mr-1" />
        This view is intended for master field operations support and operator coordination.
      </div>
    </div>
  );
};

export default FieldOperatorDirectory;
