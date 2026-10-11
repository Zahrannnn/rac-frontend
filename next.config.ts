import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-terminal logging only; has no effect on production builds.
  logging: {
    // Forward browser console warnings/errors to the terminal; `true` forwards all output.
    browserToTerminal: "warn",
    fetches: {
      fullUrl: true,
    },
    incomingRequests: {
      ignore: [
        /\/favicon\.ico$/,
        /\/_next\/static\//,
        /\/api\/health/,
        /\/\.well-known\//,
      ],
    },
  },
  cacheComponents: true,
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
  // The site sits behind Hostinger's hcdn, which honors origin Cache-Control
  // literally. Next's default for prerendered HTML (s-maxage=31536000) poisons
  // the edge with stale documents after every deploy — HTML must revalidate;
  // content-hashed static assets stay immutable.
  // Dev is exempt: Turbopack's dev chunk URLs are not content-hashed, so the
  // immutable header would pin a year-old chunk in the local browser and every
  // code change would look "not applied" until a hard reload.
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
