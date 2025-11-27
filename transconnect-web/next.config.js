/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost', 
      'transconnect.app', 
      'www.transconnect.app',
      'admin.transconnect.app',
      'operators.transconnect.app'
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  },
  // Enable rewrites for subdomain handling in development
  async rewrites() {
    return {
      beforeFiles: [
        // Handle admin subdomain routing
        {
          source: '/:path*',
          destination: '/admin/:path*',
          has: [
            {
              type: 'host',
              value: 'admin.transconnect.app',
            },
          ],
        },
        // Handle operators subdomain routing
        {
          source: '/:path*',
          destination: '/operators/:path*',
          has: [
            {
              type: 'host',
              value: 'operators.transconnect.app',
            },
          ],
        },
      ],
    };
  },
}

module.exports = nextConfig