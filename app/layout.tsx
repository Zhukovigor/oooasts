import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import CookieConsent from "@/components/cookie-consent"
import "./globals.css"

const CANONICAL_URL = "https://oooasts.ru"

export const metadata: Metadata = {
  title: "Поставщик строительной спецтехники | ООО АСТС - Поставка грузов из Китая в Россию",
  description:
    "✅ Купить экскаватор Komatsu PC200, PC300, PC400 из Китая ⭐ Новые и б/у ⭐ Полное документальное сопровождение ⭐ Выгодные цены ⭐ Доставка по РФ ⚡ Выгодные цены",
  metadataBase: new URL(CANONICAL_URL),
  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/",
    },
  },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  keywords: [
    // Экскаваторы - базовые запросы
    "купить экскаватор",
    "купить бульдозер",
    "купить бульдозер komatsu",
    "купить экскаватор komatsu",
    "поставка спецтехники из китая",
    "купить автобетононасос sany",
    "купить автобетононасос zoomlion",
    "лизинг спецтехники",
    "ооо астс",

  ],

  authors: [{ name: "ООО АСТС" }],
  openGraph: {
    title: "Купить экскаватор Komatsu PC200, PC300, PC400 | ООО АСТС",
    description:
      "Поставка новых и б/у экскаваторов Komatsu из Китая. Полное документальное сопровождение. Выгодные цены.",
    url: CANONICAL_URL,
    siteName: "ООО АСТС",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: `${CANONICAL_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "ООО АСТС - Поставка спецтехники из Китая",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Купить экскаватор Komatsu PC200, PC300, PC400 | ООО АСТС",
    description: "Поставка новых и б/у экскаваторов Komatsu из Китая",
    images: [`${CANONICAL_URL}/og-image.jpg`],
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
  generator: "v0.app",
  other: {
    "google-site-verification": "2v-vYX6Wszq50FTPt5WDDrW5bxHWOHp1MdGtrf9tbSI",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://mc.yandex.ru" />
        <link rel="preconnect" href="https://top-fwz1.mail.ru" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        <link rel="dns-prefetch" href="https://top-fwz1.mail.ru" />

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NJHGMTJQ');`}
        </Script>

        <meta name="google-site-verification" content="2v-vYX6Wszq50FTPt5WDDrW5bxHWOHp1MdGtrf9tbSI" />
        <meta name="yandex-verification" content="04df37bb570ff95c" />
        <meta name="yandex-verification" content="af7a35725a67ba4e" />

        <Script id="top-mail-ru" strategy="afterInteractive">
          {`
            var _tmr = window._tmr || (window._tmr = []);
            _tmr.push({id: "3708181", type: "pageView", start: (new Date()).getTime()});
            (function (d, w, id) {
              if (d.getElementById(id)) return;
              var ts = d.createElement("script"); ts.type = "text/javascript"; ts.async = true; ts.id = id;
              ts.src = "https://top-fwz1.mail.ru/js/code.js";
              var f = function () {var s = d.getElementsByTagName("script")[0]; s.parentNode.insertBefore(ts, s);};
              if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); }
            })(document, window, "tmr-code");
          `}
        </Script>
        <noscript>
          <div>
            <img
              src="https://top-fwz1.mail.ru/counter?id=3708181;js=na"
              style={{ position: "absolute", left: "-9999px" }}
              alt="Top.Mail.Ru"
            />
          </div>
        </noscript>

        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=104548955', 'ym');
            ym(104548955, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true});
          `}
        </Script>
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/104548955" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ООО АСТС",
              url: CANONICAL_URL,
              logo: `${CANONICAL_URL}/images/logo.png`,
              image: `${CANONICAL_URL}/images/logo.png`,
              description:
                "Поставщик строительной спецтехники из Китая. Экскаваторы Komatsu, автобетононасосы SANY и Zoomlion.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "RU",
                addressRegion: "Смоленская область",
                addressLocality: "Рославль",
              },
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+7-919-042-24-92",
                contactType: "sales",
                availableLanguage: ["Russian"],
                email: "zhukovigor@yandex.ru",
              },
              sameAs: ["https://t.me/oooasts", "https://vk.com/oooasts"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "ООО АСТС",
              image: `${CANONICAL_URL}/images/logo.png`,
              description: "Поставка строительной спецтехники, экскаваторов Komatsu, автобетононасосов из Китая",
              address: {
                "@type": "PostalAddress",
                addressCountry: "RU",
                addressRegion: "Смоленская область",
                addressLocality: "Рославль",
              },
              telephone: "+7-919-042-24-92",
              email: "zhukovigor@yandex.ru",
              priceRange: "$$",
              openingHours: "Mo-Fr 09:00-18:00",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "ООО АСТС",
              url: CANONICAL_URL,
              description: "Поставка строительной спецтехники из Китая",
              publisher: {
                "@type": "Organization",
                name: "ООО АСТС",
                logo: {
                  "@type": "ImageObject",
                  url: `${CANONICAL_URL}/images/logo.png`,
                },
              },
            }),
          }}
        />
      </head>

      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NJHGMTJQ"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Suspense fallback={null}>
          {children}
          <Analytics />
          <CookieConsent />
        </Suspense>
      </body>
    </html>
  )
}
