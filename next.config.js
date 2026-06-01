const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    // Cache RSC payloads on the client so revisiting a route within
    // this window skips the server round-trip entirely.
    staleTimes: {
      dynamic: 30,   // user-specific pages: 30s
      static: 300,   // public pages: 5min
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://nexus-source:8000/:path*',
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
