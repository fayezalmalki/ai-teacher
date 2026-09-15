import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/profiles`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
