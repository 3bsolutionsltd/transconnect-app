import React from 'react';
import { 
  Users, 
  Eye, 
  UserCheck, 
  UserX, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Building
} from 'lucide-react';

interface OperatorUser {
  id: string;
  userId: string;
  operatorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  verified: boolean;
  role: 'MANAGER' | 'DRIVER' | 'CONDUCTOR' | 'TICKETER' | 'MAINTENANCE';
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

interface OperatorUserTableProps {
  operatorUsers: OperatorUser[];
  operators: Operator[];
  onEdit: (operatorUser: OperatorUser) => void;
  onToggle: (userId: string, currentStatus: boolean) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}

const OperatorUserTable: React.FC<OperatorUserTableProps> = ({
  operatorUsers,
  operators,
  onEdit,
  onToggle,
  onDelete
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Staff Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role & Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operatorUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
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
                        ID: {user.userId.slice(0, 8)}...
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperatorRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                    {user.operator && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-1 text-gray-400" />
                        {user.operator.companyName}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                    <div className="text-xs text-gray-500">
                      {user.verified ? 'Verified' : 'Unverified'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(user.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit operator user"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggle(user.id, user.active)}
                      className={`p-2 rounded-md transition-colors ${
                        user.active 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={user.active ? 'Deactivate user' : 'Activate user'}
                    >
                      {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
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

      {operatorUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No operator staff found</h3>
          <p className="text-gray-600">
            No operator staff members have been created yet or match your current filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default OperatorUserTable;