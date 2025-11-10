'use client'

import { QueryClient, QueryClientProvider } from 'react-query'
import { useState } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import NotificationToast from '@/components/notifications/NotificationToast'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          {children}
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}