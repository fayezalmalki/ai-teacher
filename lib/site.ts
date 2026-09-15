/**
 * Footer links, social links and the powered-by brand. Mirrors
 * docs/site-config.js; edit both together. Never hard-code these in components.
 */
export interface SiteLink {
  label: string;
  href: string;
}

export const site = {
  name: "المعلم الذكي",
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
