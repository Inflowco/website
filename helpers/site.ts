// Small helpers for the public site build.

// Prefix a public/ asset with the Vite base path so it works both at "/" and
// under a GitHub Pages project path such as "/website/".
export const asset = (path: string): string => {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/$/, "") + "/" + path.replace(/^\//, "");
};

// Absolute site origin for Open Graph tags. Set by the deploy workflow.
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL as string | undefined) || "";

// Formspree form id, when one exists. Without it the contact form falls back
// to opening the visitor's email client with the message filled in.
export const FORMSPREE_ID: string = (import.meta.env.VITE_FORMSPREE_ID as string | undefined) || "";

// True when building the static public site (no backend, no login).
export const PUBLIC_ONLY: boolean = import.meta.env.VITE_PUBLIC_ONLY === "1";

export const CONTACT = {
  name: "Peter Vinck",
  title: "Senior Engineering Consultant",
  email: "peter.vinck@inflowco.com",
  phone: "612-845-2589",
  phoneHref: "tel:+16128452589",
  company: "Inflow Corp.",
  address1: "PO Box 14180",
  address2: "Saint Paul, MN 55114",
};

export const AWARD_LINE =
  "Xcel Energy Energy Efficiency Partner Award winner, twelve consecutive years, 2015 to 2026";
export const AWARD_SHORT = "Xcel Energy Partner Award, every year since 2015";
