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
  // Handle redirects for subdomain routing
  async redirects() {
    return [
      // Redirect www to non-www
      {
        source: '/(.*)',
        has: [
          {
            type: 'host',
            value: 'www.transconnect.app',
          },
        ],
        destination: 'https://transconnect.app/$1',
        permanent: true,
      },
    ];
  },
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