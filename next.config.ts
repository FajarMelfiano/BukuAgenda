import type { NextConfig } from "next";

/**
 * Header keamanan untuk aplikasi administrasi desa.
 * CSP sengaja ketat: tidak ada sumber eksternal sama sekali — font di-self-host,
 * tidak ada skrip pihak ketiga, tidak ada iframe.*Kirim data keluar* (ke CDN,
 * analitik) ditolak di lapisan browser, bukan sekadar kita berjanji.
 */
const csp = [
  "default-src 'self'",
  // Next.js menyuntikkan skrip inline kecil untuk bootstrap hydration.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;