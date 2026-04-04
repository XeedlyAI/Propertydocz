import type { Metadata } from "next";

const SITE_NAME = "PropertyDocz";
const SITE_URL = "https://propertydocz.com";
const DEFAULT_DESCRIPTION =
  "Order HOA resale certificates, payoff statements, lender questionnaires, and governing documents online. AI-powered generation, digital delivery, transparent pricing.";

/**
 * Build a complete Metadata object with OG + Twitter tags.
 * Usage:
 *   export const metadata = buildMetadata({ title: "Pricing", description: "..." });
 */
export function buildMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    ogImage = "/og-image.png",
    noIndex = false,
  } = opts;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — HOA Document Ordering Platform`;
  const url = `${SITE_URL}${path}`;
  const imageUrl = ogImage.startsWith("http") ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} — HOA Document Ordering`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION };
