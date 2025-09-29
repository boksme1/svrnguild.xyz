/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client']
  }
};

module.exports = nextConfig;
