const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "propertydocz.com";

export function getTenantSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0];

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostname.replace(`.${APP_DOMAIN}`, "");
    if (slug && slug !== "www") {
      return slug;
    }
  }

  return null;
}
