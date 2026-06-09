import type { NextConfig } from "next";

const repoName = "gibz-raumvermietung";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages. This requires every route to be
  // statically renderable — no server-rendered / dynamic (`ƒ`) routes.
  output: "export",
  turbopack: {
    root: process.cwd(),
  },
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGitHubPages
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
        env: { NEXT_PUBLIC_BASE_PATH: `/${repoName}` },
      }
    : {}),
};

export default nextConfig;
