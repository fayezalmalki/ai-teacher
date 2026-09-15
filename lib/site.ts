/**
 * Footer links, social links and the powered-by brand. Mirrors
 * docs/site-config.js; edit both together. Never hard-code these in components.
 */
export interface SiteLink {
  label: string;
  href: string;
}

/** Public host the app is served from; aliases redirect here. */
export const CANONICAL_HOST = "school.mvp.sa";
export const ALIAS_HOSTS = ["learn.mvp.sa"];

export const site = {
  name: "المعلم الذكي",
  /** Absolute origin for metadata, sitemap and share links. Override with NEXT_PUBLIC_SITE_URL. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${CANONICAL_HOST}`).replace(/\/$/, ""),
  description: "معلم يشرح، يسمع، ويغيّر طريقته حسب طفلك.",
  poweredBy: { label: "mvp.sa", url: "https://mvp.sa", logo: "/brand/mvp-black.png" },
  links: [
    { label: "عن المشروع", href: "#about" },
    { label: "للمدارس", href: "#schools" },
    { label: "الخصوصية", href: "#privacy" },
    { label: "تواصل معنا", href: "mailto:hello@mvp.sa" },
  ] as SiteLink[],
  social: [
    { label: "X", href: "https://x.com/mvpsa" },
    { label: "LinkedIn", href: "https://linkedin.com/company/mvpsa" },
  ] as SiteLink[],
  copyright: "© 2026 المعلم الذكي",
};
