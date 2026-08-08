const SAFE_PROTOCOLS = ["http:", "https:", "mailto:"];

// Only http, https, and mailto links are ever rendered as real clickable
// anchors. This stops a javascript: or data: URI slipping into rendered
// content (AI generated or otherwise) from executing when someone clicks
// it. Everything else renders as plain text instead of a link.
export function isSafeHref(href: string | undefined | null): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, "https://cypher.invalid");
    return SAFE_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}
