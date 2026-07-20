import type { MetadataRoute } from "next";

const BASE_URL = "https://big-nona.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
