/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    useWasmBinary: true,
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
