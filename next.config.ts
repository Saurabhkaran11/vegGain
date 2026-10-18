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
  // Pin the project root so a stray package-lock.json in the home folder is ignored.
  turbopack: { root: path.resolve(__dirname) },
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses],
  // Only the dish photos in /public/meals are optimized by next/image.
  images: {
    localPatterns: [{ pathname: "/meals/**", search: "" }],
    // YouTube video thumbnails on the Chefs pages (fetched by the chefs agent).
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
