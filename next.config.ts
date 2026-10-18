import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";
import path from "node:path";

// Allow this machine's own network addresses (e.g. 192.168.x.x) to load dev scripts,
// so the site also works when opened from the "Network" URL or a phone on the same Wi-Fi.
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n!.address);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Pin the project root so a stray package-lock.json in the home folder is ignored.
  turbopack: { root: path.resolve(__dirname) },
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses],
  // Only the dish photos in /public/meals are optimized by next/image.
  images: {
    localPatterns: [{ pathname: "/meals/**", search: "" }],
    // YouTube video thumbnails on the Chefs pages (fetched by the chefs agent).
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
    formats: ["image/avif", "image/webp"],
    // Optimized dish photos and thumbnails are cached for 30 days instead of re-encoded on every visit.
    minimumCacheTTL: 2592000,
    qualities: [70, 75],
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [64, 96, 128, 160, 256, 384],
  },
  // Long browser caching for files that rarely change; HTML stays fresh.
  async headers() {
    return [
      { source: "/meals/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/:file(icon.svg|robots.txt)", headers: [{ key: "Cache-Control", value: "public, max-age=86400" }] },
    ];
  },
};

export default nextConfig;
