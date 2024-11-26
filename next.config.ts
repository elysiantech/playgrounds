import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**', // Allow all paths on the domain
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '', // Leave empty if there is no specific port
        pathname: '/**', // Match all paths under this hostname
      },
      {
        protocol: 'https',
        hostname: 'science-octopus-883382604695.s3.us-west-1.amazonaws.com',
        port: '',
        pathname: '/**', // Allow all paths under the domain
      }
    ],
    dangerouslyAllowSVG: true, // Enable SVG images
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // Add a secure CSP for SVGs
  },
};

export default nextConfig;
