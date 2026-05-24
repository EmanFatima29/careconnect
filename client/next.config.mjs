import path from "path";
import { fileURLToPath } from "url";

// Provide __dirname in ESM modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ---- Image optimization ----
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "graph.facebook.com" }, // Facebook avatars
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" }, // Cloudinary uploads
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ---- Security headers ----
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  // ---- Logging (Next.js 15) ----
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // ---- Experimental ----
  experimental: {
    // Reduce bundle size by tree-shaking MUI icons package
    optimizePackageImports: [
      "@mui/icons-material",
      "@mui/material",
      "recharts",
    ],
  },

  // ---- Output ('standalone' required by Docker for minimal production image) ----
  output: process.env.NODE_ENV === "production" ? "standalone" : undefined,
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
