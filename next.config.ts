import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three ships untranspiled ESM that Next needs to bundle for both server
  // and client. Verified against the Next 16 `transpilePackages` config doc.
  transpilePackages: ["three"],
  images: {
    // Prefer modern formats; AVIF first, WebP fallback. Order matters — the
    // first match against the request's Accept header wins.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
