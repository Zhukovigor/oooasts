import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Suspense } from "react"
import Script from "next/script"
import CookieConsent from "@/components/cookie-consent"
import AdvertisementModal from "@/components/advertisement-modal"
import "./globals.css"

const CANONICAL_URL = "https://asts.vercel.app"

export const metadata: Metadata = {
  title: {
    default: "Спецтехника из Китая | Экскаваторы Komatsu, бетононасосы SANY | ООО АСТС",
    template: "%s | ООО АСТС",
  },
  description: "Поставка строительной спецтехники из Китая: экскаваторы Komatsu, автобетононасосы SANY и Zoomlion. Новые и б/у с документами. Доставка по РФ. ☎ +7 (919) 042-24-92",
  metadataBase: new URL(CANONICAL_URL),
  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  keywords: [
    "купить спецтехнику",
    "спецтехника из китая",
    "поставка спецтехники",
    "купить экскаватор",
    "экскаватор komatsu",
    "купить автобетононасос",
    "автобетононасос sany",
    "автобетононасоз zoomlion",
    "лизинг спецтехники",
    "ооо астс",
    "строительная техника",
    "китайская спецтехника",
    "экскаваторы бу",
    "бетононасосы бу",
  ],
  authors: [{ name: "ООО АСТС" }],
  creator: "ООО АСТС",
  publisher: "ООО АСТС",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: CANONICAL_URL,
    siteName: "ООО АСТС - Поставка спецтехники из Китая",
    title: "Спецтехника из Китая | Экскаваторы Komatsu, бетононасосы SANY | ООО АСТС",
    description: "Поставка строительной спецтехники из Китая: экскаваторы Komatsu, автобетононасосы SANY и Zoomlion. Новые и б/у с документами. Доставка по РФ. Звоните!",
    images: [
      {
        url: `${CANONICAL_URL}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ООО АСТС - Спецтехника из Китая: экскаваторы, бетононасосы, строительная техника",
        type: "image/png",
      },
    ],
    emails: ["info@asts.ru"],
    phoneNumbers: ["+79190422492"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Спецтехника из Китая | Экскаваторы Komatsu, бетононасосы SANY | ООО АСТС",
    description: "Поставка строительной спецтехники из Китая: экскаваторы Komatsu, автобетононасосы SANY и Zoomlion. Новые и б/у с документами. Доставка по РФ.",
    images: [`${CANONICAL_URL}/images/og-image.png`],
    creator: "@asts_ru",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "2v-vYX6Wszq50FTPt5WDDrW5bxHWOHp1MdGtrf9tbSI",
    yandex: "04df37bb570ff95c",
  },
  category: "construction equipment",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ООО АСТС",
  },
    generator: 'v0.app'
}

// Structured Data для организации
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ООО АСТС",
  alternateName: "ASTS",
  url: CANONICAL_URL,
  logo: `${CANONICAL_URL}/images/logo.png`,
  description: "Поставщик строительной спецтехники из Китая. Экскаваторы Komatsu, автобетононасосы SANY и Zoomlion. Новые и б/у техника с полным документальным сопровождением.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "пер. 1-й Пионерский, 38",
    addressCountry: "RU",
    addressRegion: "Смоленская область",
    addressLocality: "Рославль",
    postalCode: "216505",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+7-919-042-24-92",
    contactType: "customer service",
    areaServed: "RU",
    availableLanguage: ["Russian"],
    email: "info@asts.ru",
  },
  sameAs: [
    "https://vk.com/asts",
    "https://t.me/asts_ru",
  ],
}

// Structured Data для LocalBusiness
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "ООО АСТС",
  image: `${CANONICAL_URL}/images/logo.png`,
  description: "Поставка строительной спецтехники, экскаваторов Komatsu, автобетононасосов SANY и Zoomlion из Китая. Новые и б/у машины с гарантией.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. Пролетарская, 123",
    addressCountry: "RU",
    addressRegion: "Смоленская область",
    addressLocality: "Рославль",
    postalCode: "216500",
  },
  telephone: "+7-919-042-24-92",
  email: "info@asts.ru",
  priceRange: "$$$",
  openingHours: ["Mo-Fr 08:00-21:00", "Sa 09:00-18:00"],
  geo: {
    "@type": "GeoCoordinates",
    latitude: "53.9500",
    longitude: "32.8667",
  },
  makesOffer: [
    "Экскаваторы",
    "Бульдозеры", 
    "Автобетононасосы",
    "Автокраны",
    "Погрузчики",
    "Дорожные катки",
    "Самосвалы",
    "Автобетоносмесители"
  ],
  areaServed: "RU",
}

// Breadcrumb structured data
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Главная",
      item: CANONICAL_URL,
    },
  ],
}

// Website structured data
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ООО АСТС - Поставка спецтехники из Китая",
  url: CANONICAL_URL,
  description: "Поставка строительной спецтехники из Китая: экскаваторы Komatsu, автобетононасосы SANY и Zoomlion",
  potentialAction: {
    "@type": "SearchAction",
    target: `${CANONICAL_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

// Client Component для аналитики
function AnalyticsScripts() {
  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NJHGMTJQ');`,
        }}
      />

      {/* Google Analytics (gtag.js) */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-JV4J54L6G6"
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JV4J54L6G6', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `,
        }}
      />

      {/* Top.Mail.Ru */}
      <Script
        id="top-mail-ru"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var _tmr = window._tmr || (window._tmr = []);
            _tmr.push({id: "3708181", type: "pageView", start: (new Date()).getTime()});
            (function (d, w, id) {
              if (d.getElementById(id)) return;
              var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
              ts.src = "https://top-fwz1.mail.ru/js/code.js";
              var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
              if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
            })(document, window, "tmr-code");
          `,
        }}
      />

      {/* Yandex Metrika */}
      <Script
        id="yandex-metrika"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
            ym(104548955, 'init', {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true,
              ecommerce:"dataLayer"
            });
          `,
        }}
      />
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="scroll-smooth">
      <head>
        {/* Preconnect для улучшения производительности */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://mc.yandex.ru" />
        <link rel="preconnect" href="https://top-fwz1.mail.ru" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Basic Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ООО АСТС" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          key="organization-schema"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          key="localbusiness-schema"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          key="breadcrumb-schema"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
          key="website-schema"
        />
      </head>

      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NJHGMTJQ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>

        {/* Yandex Metrika (noscript) */}
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/104548955"
              style={{ position: "absolute", left: "-9999px" }}
              alt="Yandex Metrika"
            />
          </div>
        </noscript>

        {/* Top.Mail.Ru (noscript) */}
        <noscript>
          <div>
            <img
              src="https://top-fwz1.mail.ru/counter?id=3708181;js=na"
              style={{ position: "absolute", left: "-9999px" }}
              alt="Top.Mail.Ru"
            />
          </div>
        </noscript>

        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Загрузка ООО АСТС...</p>
              </div>
            </div>
          }
        >
          {children}
          <AdvertisementModal />
          <Analytics />
          <SpeedInsights />
          <CookieConsent />
          <AnalyticsScripts />
        </Suspense>
      </body>
    </html>
  )
}
