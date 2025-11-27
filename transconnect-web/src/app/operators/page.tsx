import Link from 'next/link'

export default function OperatorsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Operator Management Portal
        </h2>
        <p className="text-gray-600 mb-6">
          Manage your bus operations, routes, fleet, and bookings efficiently.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Fleet Management</h3>
            <p className="text-blue-600 text-sm mb-4">Manage your buses and vehicles</p>
            <Link 
              href="/operators/fleet" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Manage Fleet
            </Link>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Routes & Schedules</h3>
            <p className="text-green-600 text-sm mb-4">Configure routes and schedules</p>
            <Link 
              href="/operators/routes" 
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Manage Routes
            </Link>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">Bookings</h3>
            <p className="text-purple-600 text-sm mb-4">View and manage bookings</p>
            <Link 
              href="/operators/bookings" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              View Bookings
            </Link>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">Revenue</h3>
            <p className="text-orange-600 text-sm mb-4">Track earnings and payments</p>
            <Link 
              href="/operators/revenue" 
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm"
            >
              View Revenue
            </Link>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">Reports</h3>
            <p className="text-red-600 text-sm mb-4">Generate operational reports</p>
            <Link 
              href="/operators/reports" 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
            >
              View Reports
            </Link>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-2">Settings</h3>
            <p className="text-indigo-600 text-sm mb-4">Configure operator settings</p>
            <Link 
              href="/operators/settings" 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Active Buses</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Today's Bookings</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-purple-600">UGX 0</div>
            <div className="text-sm text-gray-600">Today's Revenue</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-orange-600">0</div>
            <div className="text-sm text-gray-600">Active Routes</div>
          </div>
        </div>
      </div>
    </div>
  )
}