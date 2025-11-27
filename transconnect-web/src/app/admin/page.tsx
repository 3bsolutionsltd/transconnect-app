import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome to TransConnect Admin
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your TransConnect platform from this centralized dashboard.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">User Management</h3>
            <p className="text-blue-600 text-sm mb-4">Manage passengers and agents</p>
            <Link 
              href="/admin/users" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Manage Users
            </Link>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Operators</h3>
            <p className="text-green-600 text-sm mb-4">Manage bus operators and routes</p>
            <Link 
              href="/admin/operators" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Manage Operators
            </Link>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">Analytics</h3>
            <p className="text-purple-600 text-sm mb-4">View platform statistics</p>
            <Link 
              href="/admin/analytics" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              View Analytics
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/admin/settings" 
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Platform Settings
          </Link>
          <Link 
            href="/admin/reports" 
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Generate Reports
          </Link>
          <Link 
            href="/admin/notifications" 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Send Notifications
          </Link>
        </div>
      </div>
    </div>
  )
}