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
};

export default nextConfig;
