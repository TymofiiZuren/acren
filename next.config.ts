import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/privacy.ts";
import { validateHostedConfiguration } from "./src/lib/deployment.ts";

if (process.env.VERCEL === "1") {
  validateHostedConfiguration(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
