import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/platform/",
          "/agent/",
          "/api/",
          "/login",
          "/success",
        ],
      },
    ],
    sitemap: "https://propertydocz.com/sitemap.xml",
  };
}
