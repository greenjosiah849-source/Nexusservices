/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.roblox.com",
      },
      {
        protocol: "https",
        hostname: "**.rbxcdn.com",
      },
    ],
  },
}

export default nextConfig
