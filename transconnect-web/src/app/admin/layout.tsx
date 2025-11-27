import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TransConnect Admin - Dashboard',
  description: 'TransConnect platform administration and management',
  keywords: ['admin', 'dashboard', 'TransConnect', 'management'],
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">TransConnect Admin Dashboard</h1>
        <p className="text-blue-100">admin.transconnect.app</p>
      </div>
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  )
}