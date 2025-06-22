// Example next.config.js for proxy setup
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8080/api/v1/:path*',
      },
    ]
  },
}

// Or if using environment variables:
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/:path*`,
      },
    ]
  },
}

// Example environment variables (.env.local):
// NEXT_PUBLIC_API_URL=http://localhost:8080

