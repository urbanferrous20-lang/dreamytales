import {
  ADDON_CHILD_ZAR,
  BASE_MONTHLY_ZAR,
  TRIAL_DAYS,
  annualTotal,
  formatZar,
  monthlyTotal,
} from "@/lib/pricing";
import { CONTACT_EMAIL, SITE_DOMAIN, SITE_URL } from "@/lib/site";

export const SITE_NAME = "Dreamy Tales";

export const DEFAULT_TITLE =
  "Dreamy Tales — Personalised Bedtime Short Stories for South African Families";

export const DEFAULT_DESCRIPTION =
  "Custom illustrated bedtime short stories delivered to your inbox every night at 6pm SAST. " +
  `${formatZar(BASE_MONTHLY_ZAR)}/month for 30+ unique stories. All 11 SA languages. ${TRIAL_DAYS}-day free trial.`;

/** Search & discovery keywords — South Africa + parent intent */
export const SEO_KEYWORDS = [
  "personalised bedtime short stories South Africa",
  "custom bedtime short stories for kids",
  "bedtime short story subscription",
  "illustrated bedtime short stories PDF",
  "AI bedtime short stories South Africa",
  "nightly bedtime short stories email",
  "children's story subscription",
  "Afrikaans bedtime short stories",
  "isiZulu bedtime short stories",
  "isiXhosa bedtime short stories",
  "personalised children's books South Africa",
  "bedtime short stories Cape Town",
  "bedtime short stories Johannesburg",
  "custom stories with child's name",
  "PayFast bedtime short stories",
  "Dreamy Tales",
  "dreamytales.co.za",
] as const;

export const FAQ_ITEMS = [
  {
    q: "How many stories do I get?",
    a: "30+ unique custom stories every month — one every night, delivered at 6pm South African time.",
  },
  {
    q: "Are the stories age-appropriate?",
    a: "Yes. We tailor vocabulary, length, and themes to your child's age (3–12). Age is calculated from their date of birth and updates automatically so stories grow with them.",
  },
  {
    q: "Which languages are available?",
    a: "All 11 of South Africa's official languages — including English, Afrikaans, isiZulu, isiXhosa, Sesotho, Setswana, and more. Choose your language during signup and every nightly story is written in it.",
  },
  {
    q: "Can I leave a review?",
    a: "Yes. In your dashboard you can rate Dreamy Tales overall and rate individual bedtime short stories. Helpful reviews may appear on our homepage (first name only).",
  },
  {
    q: "Can I cancel?",
    a: "Absolutely. Cancel anytime with one month's notice. You keep receiving stories until your notice period ends, and you won't be charged again.",
  },
  {
    q: "What about multiple children?",
    a: `Add each child during signup. First child ${formatZar(BASE_MONTHLY_ZAR)}/month, each additional child ${formatZar(ADDON_CHILD_ZAR)}/month — each gets their own nightly story.`,
  },
  {
    q: "Can I pay annually?",
    a: `Yes. Choose annual billing at signup and pay for 11 months upfront — you get 12 months of stories (one month free). For example, one child is ${formatZar(annualTotal(1))}/year instead of ${formatZar(monthlyTotal(1) * 12)}.`,
  },
  {
    q: "How is payment handled?",
    a: "Securely through PayFast, South Africa's trusted payment gateway. We never store your card details.",
  },
] as const;

export const OG_IMAGE = {
  url: "/samples/story-page-1.png",
  width: 1024,
  height: 1365,
  alt: "Sample personalised Dreamy Tales bedtime short story page with custom illustration",
} as const;

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(OG_IMAGE.url),
    email: CONTACT_EMAIL,
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-ZA",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function buildServiceJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${SITE_NAME} — Nightly Bedtime Short Story Subscription`,
    description: DEFAULT_DESCRIPTION,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    serviceType: "Personalised bedtime short story subscription",
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/signup"),
      price: String(BASE_MONTHLY_ZAR),
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      description: `${TRIAL_DAYS}-day free trial, then ${formatZar(BASE_MONTHLY_ZAR)}/month for the first child`,
    },
  };
}

export function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Plain-text summary for /llms.txt and AI crawlers */
export function buildLlmsFullText(): string {
  return `# Dreamy Tales — Full site summary for AI assistants

> ${DEFAULT_DESCRIPTION}

## What is Dreamy Tales?

Dreamy Tales (${SITE_URL}) is a South African subscription service for parents of children aged 3–12. Every evening at 6pm South African Standard Time (SAST), subscribers receive a brand-new personalised bedtime short story as an illustrated PDF in their email inbox.

Each story is written for a specific child using their name, age, interests, hometown, and family details from a signup questionnaire. Stories are inclusive, age-appropriate, and can be written in any of South Africa's 11 official languages.

## Who is it for?

- Parents in South Africa who want fresh bedtime short stories without buying new books every week
- Families who want stories featuring their child's name, interests, and local places
- Multilingual households wanting bedtime short stories in Afrikaans, isiZulu, isiXhosa, Sesotho, Setswana, or other SA languages
- Parents of multiple children — each child gets their own separate story stream

## Pricing (${SITE_DOMAIN})

- First child: ${formatZar(BASE_MONTHLY_ZAR)}/month (~30 stories per month, one per night)
- Each additional child: ${formatZar(ADDON_CHILD_ZAR)}/month
- ${TRIAL_DAYS}-day free trial at signup
- Annual billing: pay 11 months, receive 12 months (one month free)
- Example: 2 children = ${formatZar(monthlyTotal(2))}/month
- Payments via PayFast (South Africa)

## How it works

1. Complete a questionnaire about each child (name, age, interests, city, language, topics to avoid)
2. Start a ${TRIAL_DAYS}-day free trial with PayFast
3. Receive a new illustrated PDF story by email every night at 6pm SAST
4. Manage subscription, download past stories, and leave reviews from the parent dashboard

## Key pages

- Homepage: ${SITE_URL}/
- Start free trial: ${SITE_URL}/signup
- Login: ${SITE_URL}/login
- Terms & Conditions: ${SITE_URL}/terms
- Privacy Policy (POPIA): ${SITE_URL}/privacy
- Contact: ${CONTACT_EMAIL}

## Frequently asked questions

${FAQ_ITEMS.map((item) => `### ${item.q}\n${item.a}`).join("\n\n")}

## Legal & privacy

Dreamy Tales operates in the Republic of South Africa. Personal information is processed in accordance with POPIA (Protection of Personal Information Act). Payment card details are handled by PayFast; Dreamy Tales does not store card numbers.

## Search terms people use

personalised bedtime short stories South Africa, custom children's bedtime short stories, bedtime short story subscription SA, illustrated PDF stories for kids, nightly bedtime short stories email, Afrikaans bedtime short stories, isiZulu bedtime short stories, AI bedtime short stories for children, PayFast subscription bedtime short stories, Dreamy Tales, ${SITE_DOMAIN}
`;
}
