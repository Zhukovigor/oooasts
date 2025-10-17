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
    "Купить экскаватор Komatsu PC200, PC300, PC400 из Китая ⭐ Новые и б/у экскаваторы ⭐ Полное документальное сопровождение ⭐ Выгодные цены ⭐ Доставка по РФ",
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
    "купить экскаватор komatsu",
    "комацу экскаватор цена",
    "экскаватор komatsu pc200",
    "экскаватор komatsu pc300",
    "экскаватор komatsu pc400",

    // Long-tail запросы - конкретные модели + характеристики
    "komatsu pc200 технические характеристики",
    "komatsu pc300 вес и размеры",
    "komatsu pc400 мощность двигателя",
    "экскаватор komatsu pc200 объем ковша",
    "komatsu pc200 расход топлива",
    "komatsu pc300 глубина копания",
    "экскаватор 20 тонн купить",
    "экскаватор 30 тонн цена",
    "гусеничный экскаватор 20 тонн",

    // Коммерческие запросы - цена, стоимость, прайс
    "экскаватор komatsu цена",
    "komatsu pc200 стоимость",
    "komatsu pc300 прайс",
    "сколько стоит экскаватор komatsu",
    "экскаватор komatsu цена новый",
    "экскаватор komatsu бу цена",
    "прайс лист экскаваторы komatsu",
    "стоимость экскаватора из китая",
    "цена экскаватора с доставкой",
    "экскаватор под ключ цена",

    // Информационные запросы - как выбрать, какой лучше
    "как выбрать экскаватор",
    "какой экскаватор лучше купить",
    "komatsu или caterpillar что лучше",
    "как выбрать экскаватор для стройки",
    "какой экскаватор выбрать для карьера",
    "отзывы об экскаваторах komatsu",
    "надежность экскаваторов komatsu",
    "ресурс двигателя komatsu",
    "обслуживание экскаватора komatsu",

    // Локальные запросы - города России
    "купить экскаватор москва",
    "купить экскаватор санкт-петербург",
    "купить экскаватор спб",
    "экскаватор komatsu москва",
    "экскаватор komatsu новосибирск",
    "экскаватор komatsu екатеринбург",
    "экскаватор komatsu казань",
    "экскаватор komatsu краснодар",
    "экскаватор komatsu ростов",
    "экскаватор komatsu владивосток",
    "экскаватор komatsu хабаровск",
    "экскаватор komatsu иркутск",
    "экскаватор komatsu красноярск",
    "экскаватор komatsu тюмень",
    "экскаватор komatsu челябинск",
    "экскаватор komatsu уфа",
    "экскаватор komatsu самара",
    "экскаватор komatsu нижний новгород",
    "экскаватор komatsu воронеж",
    "экскаватор komatsu пермь",
    "доставка экскаватора по россии",
    "доставка спецтехники москва",
    "доставка спецтехники спб",

    // Остальные базовые запросы
    "экскаватор caterpillar купить",
    "экскаватор hitachi цена",
    "экскаватор hyundai купить",
    "экскаватор liugong",
    "экскаватор jcb",
    "мини экскаватор купить",
    "мини экскаватор бу",
    "колесный экскаватор купить",
    "гусеничный экскаватор купить",
    "экскаватор volvo",
    "экскаватор sumitomo",
    "экскаватор xcmg купить",
    "экскаватор на складе",
    "экскаватор под заказ",
    "экскаватор с ГТС",
    "ремонт экскаватора",
    "доставка экскаватора",
    "аренда экскаватора",
    "экскаватор в лизинг",
    "экскаватор с ндс",

    // Автобетононасосы - базовые + расширенные
    "купить автобетононасос",
    "автобетононасос цена",
    "автобетононасос sany",
    "автобетононасос zoomlion",
    "автобетононасос 31 метр",
    "автобетононасос 33 метра",
    "автобетононасос 50 метров",
    "автобетононасос стоимость",
    "автобетононасос прайс",
    "как выбрать автобетононасос",
    "какой автобетононасос лучше",
    "автобетононасос москва",
    "автобетононасос спб",
    "автобетононасос из китая",
    "автобетононасос аренда",
    "автобетононасос в лизинг",

    // Погрузчики
    "купить погрузчик",
    "фронтальный погрузчик цена",
    "фронтальный погрузчик из китая",
    "купить вилочный погрузчик",
    "вилочный погрузчик бу",
    "телескопический погрузчик купить",
    "погрузчик xcmg",
    "погрузчик lonking",
    "мини погрузчик купить",
    "погрузчик аренда",
    "погрузчик в лизинг",

    // Бульдозеры
    "купить бульдозер",
    "бульдозер komatsu",
    "бульдозер shantui",
    "бульдозер caterpillar",
    "бульдозер бу купить",
    "бульдозер доставка",
    "бульдозер аренда",
    "бульдозер запчасти",

    // Катки, грейдеры, дорожная техника
    "купить дорожный каток",
    "каток xcmg",
    "каток hamm",
    "купить автогрейдер",
    "автогрейдер gr165",
    "грейдер новый",
    "грейдер бу",
    "дорожная техника купить",
    "ремонт дорожной техники",

    // Краны, манипуляторы
    "купить автокран",
    "автокран xcmg",
    "автокран китаец",
    "автокран аренда",
    "манипулятор купить",
    "манипулятор бу",

    // Самосвалы, грузовики, тягачи
    "купить самосвал",
    "самосвал howo",
    "самосвал shacman",
    "самосвал бу",
    "купить тягач",
    "тягач аренда",
    "купить прицеп тележку",
    "низкорамный трал купить",

    // Прочая техника, услуги, сервис
    "купить спецтехнику",
    "аренда спецтехники",
    "спецтехника из китая",
    "спецтехника под заказ",
    "новая спецтехника",
    "бу спецтехника",
    "лизинг спецтехники",
    "обслуживание спецтехники",
    "доставка спецтехники",
    "запчасти для спецтехники",
    "ремонт спецтехники",
    "выкуп спецтехники",

    // Комплектующие
    "гидромолот купить",
    "ковш для экскаватора купить",
    "цепи для экскаватора",
    "аренда гидромолота",

    // Специальные виды работ
    "спецтехника для стройки",
    "спецтехника для сельского хозяйства",
    "техника для карьеров",
    "техника для леса",
    "техника для горных работ",

    // Лизинг
    "лизинг спецтехники",
    "лизинг экскаватора",
    "лизинг Komatsu",
    "лизинг экскаватора Komatsu",
    "лизинг автобетононасоса",
    "лизинг автокрана",
    "лизинг фронтального погрузчика",
    "купить экскаватор в лизинг",
    "купить спецтехнику в лизинг",
    "лизинг спецтехники с НДС",
    "лизинг техники без аванса",
    "лизинг бу спецтехники",
    "лизинг новой спецтехники",
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
