"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: "https://oooasts.ru",
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.label,
        item: `https://oooasts.ru${item.href}`,
      })),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <nav aria-label="Breadcrumb" className="py-4 bg-gray-50">
        <div className="container mx-auto px-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/" className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors">
                <Home className="w-4 h-4" />
                <span>Главная</span>
              </Link>
            </li>
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                {index === items.length - 1 ? (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                ) : (
                  <Link href={item.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  )
}
