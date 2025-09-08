import { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This rewrites configuration proxies API requests to your Go backend in development.
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://20.185.56.164:8080/api/v1/:path*', // Backend server URL
      },
    ]
  },

  // This headers configuration sets your Content Security Policy.
  async headers() {
    // Define the script source to include Paystack
    const scriptSrc = "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co";
    
    // Define the connect source to include Paystack's API and Twilio domains
    const connectSrc = [
      "connect-src 'self'",
      "https://api.paystack.co",
      "wss://global.vss.twilio.com",
      "https://global.vss.twilio.com",
      "wss://*.twilio.com",
      "https://*.twilio.com",
      "http://localhost:8080",
      "http://20.185.56.164:8080",           // Added: Your Azure server IP
      "https://20.185.56.164:8080",          // Added: HTTPS version just in case
      "http://echopsychology.com:8080",      // Added: Your domain with port
      "https://echopsychology.com:8080",     // Added: HTTPS version with port
      "https://echopsychology.com",          // Added: Main domain
      "http://echopsychology.com",
      " http://localhost:8081",
      "https://staging.echopsychology.com"          // Added: HTTP version of main domain
    ].join(' ');
    
    // Define the frame source to allow Paystack checkout iframe
    const frameSrc = "frame-src 'self' https://checkout.paystack.com";

    // Create a proper CSP with semicolons as separators
    const cspValue = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      connectSrc,
      frameSrc,
      "font-src 'self' https://fonts.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*', // Apply CSP to all paths
        headers: [
          {
            key: 'Content-Security-Policy',
            // Replace any invalid characters or spaces in the final policy string
            value: cspValue.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ]
  },
};

export default nextConfig;