/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      { source: '/abo', destination: '/about', permanent: true },
      { source: '/contcat', destination: '/contact', permanent: true },
      { source: '/categories/:slug', destination: '/products', permanent: false },
    ]
  },
}

export default nextConfig
