import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import ArticlesClient from "./client"
import HeroSection from "@/hero-section"
import Footer from "@/components/footer"
import Breadcrumb from "@/components/breadcrumb"

export const metadata: Metadata = {
  title: "Статьи о спецтехнике | Полезные материалы от экспертов ООО АСТС",
  description:
    "Читайте экспертные статьи о выборе, эксплуатации и обслуживании спецтехники. Советы по покупке экскаваторов, автобетононасосов и другой строительной техники из Китая.",
  keywords:
    "статьи о спецтехнике, блог о строительной технике, как выбрать экскаватор, обслуживание спецтехники, покупка техники из китая, советы по эксплуатации, экспертные материалы",
  openGraph: {
    title: "Статьи о спецтехнике | Полезные материалы от экспертов ООО АСТС",
    description:
      "Читайте экспертные статьи о выборе, эксплуатации и обслуживании спецтехники. Советы по покупке экскаваторов, автобетононасосов и другой строительной техники из Китая.",
    url: "http://oooasts.vercel.app/stati",
    type: "website",
  },
}

export default async function ArticlesPage() {
  const supabase = await createClient()

  // Fetch published articles, ordered by published date
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching articles:", error)
  }

  const breadcrumbItems = [{ label: "Главная", href: "/" }, { label: "Статьи" }]

  return (
    <>
      <HeroSection />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <Breadcrumb items={breadcrumbItems} />

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Статьи</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Статьи о строительной технике.
            </p>
          </div>

          <ArticlesClient articles={articles || []} />
        </div>
      </div>
      <Footer />
    </>
  )
}
