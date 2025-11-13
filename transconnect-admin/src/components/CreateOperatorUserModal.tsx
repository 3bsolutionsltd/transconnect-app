import React from 'react';
import { X, UserPlus } from 'lucide-react';

interface Operator {
  id: string;
  companyName: string;
  approved: boolean;
}

interface CreateOperatorUserForm {
  operatorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: 'MANAGER' | 'DRIVER' | 'CONDUCTOR' | 'TICKETER' | 'MAINTENANCE';
}

interface CreateOperatorUserModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  form: CreateOperatorUserForm;
  setForm: (form: CreateOperatorUserForm) => void;
  operators: Operator[];
  loading?: boolean;
}

const CreateOperatorUserModal: React.FC<CreateOperatorUserModalProps> = ({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  operators,
  loading = false
}) => {
  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const updateForm = (field: keyof CreateOperatorUserForm, value: string) => {
    setForm({
      ...form,
      [field]: value
    });
  };

  const approvedOperators = operators.filter(op => op.approved);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Create Operator Staff Member</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator Company *
              </label>
              <select
                value={form.operatorId}
                onChange={(e) => updateForm('operatorId', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an operator company...</option>
                {approvedOperators.map(operator => (
                  <option key={operator.id} value={operator.id}>
                    {operator.companyName}
                  </option>
                ))}
              </select>
              {approvedOperators.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No approved operator companies available. Please approve operators first.
                </p>
              )}
            </div>

            {/* Personal Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateForm('firstName', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateForm('lastName', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role and Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={form.role}
                onChange={(e) => updateForm('role', e.target.value as any)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TICKETER">Ticketer</option>
                <option value="DRIVER">Driver</option>
                <option value="CONDUCTOR">Conductor</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="MANAGER">Manager</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Managers have full access to all operator functions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateForm('password', e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password (min 6 characters)"
              />
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Role Descriptions:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Manager:</strong> Full access to all operator functions</div>
              <div><strong>Ticketer:</strong> Booking management, payment processing, QR scanning</div>
              <div><strong>Driver:</strong> Route management, trip status updates, QR scanning</div>
              <div><strong>Conductor:</strong> Passenger assistance, fare collection, QR scanning</div>
              <div><strong>Maintenance:</strong> Bus maintenance records and management</div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || approvedOperators.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOperatorUserModal;