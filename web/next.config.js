/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  experimental: {
    appDir: true,
  },
  // Ensure proper static generation
  generateStaticParams: async () => {
    return [];
  },
  // Disable telemetry for production builds
  telemetry: false,
  // Ensure proper output for Vercel
  distDir: ".next",
};

module.exports = nextConfig;
