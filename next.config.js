/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@payloadcms/db-sqlite', '@libsql/client'],
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
}

module.exports = nextConfig
