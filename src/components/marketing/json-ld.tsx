import { SITE_URL, SITE_NAME } from "@/lib/metadata";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization schema — used on homepage */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/opengraph-image`,
        description:
          "AI-powered HOA document ordering and fulfillment platform for management companies, real estate agents, and lenders.",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${SITE_URL}/for-management-companies`,
        },
        sameAs: [],
      }}
    />
  );
}

/** SoftwareApplication schema — used on homepage / pricing */
export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Multi-tenant HOA document ordering platform with AI-powered generation, branded portals, and digital delivery.",
        url: SITE_URL,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "30",
          highPrice: "250",
          offerCount: "4",
        },
      }}
    />
  );
}

/** Product schemas for each document type — used on individual doc pages */
export function DocumentProductJsonLd({
  name,
  description,
  price,
  path,
}: {
  name: string;
  description: string;
  price: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description,
        url: `${SITE_URL}${path}`,
        brand: {
          "@type": "Organization",
          name: SITE_NAME,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: SITE_NAME,
          },
        },
      }}
    />
  );
}

/** HowTo schema — used on how-it-works page */
export function HowToJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to Order HOA Documents Online",
        description:
          "Order HOA resale certificates, payoff statements, lender questionnaires, and governing documents through PropertyDocz in minutes.",
        url: `${SITE_URL}/how-it-works`,
        totalTime: "PT5M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Select Your Association",
            text: "Choose your HOA or condo association from the portal dropdown or search by address.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "Choose Documents",
            text: "Select the documents you need — resale certificate, payoff letter, lender questionnaire, or governing documents.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Enter Details & Pay",
            text: "Provide property and requester details, then pay securely via Stripe.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Receive Documents",
            text: "Documents are generated (with AI assistance) and delivered digitally — typically within 24 hours.",
          },
        ],
      }}
    />
  );
}
