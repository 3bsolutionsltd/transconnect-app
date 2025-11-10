'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, TestTube, Play } from 'lucide-react';
import NotificationDemo from '@/components/notifications/NotificationDemo';

export default function NotificationsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Bell className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Notification System Demo</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Test and preview all notification types in the TransConnect app
          </p>
        </div>

        {/* Demo Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TestTube className="h-5 w-5 mr-2 text-green-600" />
              Interactive Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Click the buttons below to trigger different notification types. 
                Notifications will appear as toast messages in the top-right corner 
                and will also be available in the notification center (bell icon in the header).
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Look for the bell icon in the header to access the notification center. 
                  The red badge shows unread notifications count.
                </p>
              </div>
            </div>
            
            <NotificationDemo />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Smart Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Booking confirmations with QR ticket ready alerts</li>
                <li>💰 Payment success/failure with retry options</li>
                <li>🚌 Trip reminders 24hrs before departure</li>
                <li>⚠️ Account verification and low balance warnings</li>
                <li>🔧 System maintenance notifications</li>
                <li>🎉 Promotional offers and updates</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 User Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>🔔 Animated bell icon with unread count</li>
                <li>📱 Responsive toast messages</li>
                <li>🎯 Actionable notifications with quick actions</li>
                <li>⏰ Auto-dismiss for non-critical notifications</li>
                <li>📋 Persistent storage for important alerts</li>
                <li>🌟 Smooth animations and transitions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚀 Production Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">✅ Deployed</h4>
                <p className="text-sm text-green-700">
                  Notification system is live and integrated into booking and payment flows
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🔧 Components</h4>
                <p className="text-sm text-blue-700">
                  NotificationCenter, Toast, Context, and Service all working seamlessly
                </p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">🎯 Ready</h4>
                <p className="text-sm text-purple-700">
                  Users will see notifications for bookings, payments, and important updates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="mt-8 text-center">
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">🎉 System Ready!</h3>
            <p className="text-gray-600 mb-4">
              The notification system is now live in production. Users will automatically receive 
              notifications for bookings, payments, and other important actions.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild>
                <a href="/search" className="flex items-center">
                  <Play className="h-4 w-4 mr-2" />
                  Test Live Booking Flow
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/bookings" className="flex items-center">
                  View My Bookings
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}