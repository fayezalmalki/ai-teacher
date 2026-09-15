import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { SUBJECTS } from "@/lib/content/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/subjects`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...SUBJECTS.map((s) => ({ url: `${site.url}/subjects/${s.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${site.url}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site.url}/profiles`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
