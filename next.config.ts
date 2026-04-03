import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@myriaddreamin/typst-ts-node-compiler"],
  outputFileTracingIncludes: {
    "/api/documents": [
      "./src/lib/documents/fonts/**/*.ttf",
      "./src/lib/documents/templates/**/*.typ",
    ],
  },
};

export default nextConfig;
