import type { NextConfig } from "next";

const repoName = "gibz-raumvermietung";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
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
