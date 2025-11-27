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
  // DNS CNAME handles www redirect, so no redirects needed here
  // Enable rewrites for subdomain handling
  async rewrites() {
    return {
      beforeFiles: [
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