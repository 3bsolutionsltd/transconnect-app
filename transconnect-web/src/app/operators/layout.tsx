import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TransConnect Operators - Management Portal',
  description: 'Manage your bus operations, routes, and fleet with TransConnect',
  keywords: ['operators', 'bus management', 'TransConnect', 'fleet'],
}

export default function OperatorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white p-4">
        <h1 className="text-xl font-bold">TransConnect Operators Portal</h1>
        <p className="text-green-100">operators.transconnect.app</p>
      </div>
      <div className="container mx-auto p-4">
        {children}
      </div>
    </div>
  )
}