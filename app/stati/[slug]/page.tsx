import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ArticleClient from "./client"
import HeroSection from "@/hero-section"
import Footer from "@/components/footer"
import Breadcrumb from "@/components/breadcrumb"

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: article } = await supabase.from("articles").select("*").eq("slug", slug).single()

  if (!article) {
    return {
      title: "Статья не найдена",
    }
  }

  const articleUrl = `https://asts.vercel.app/stati/${article.slug}`

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    keywords: article.tags?.join(", "),
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: articleUrl,
      siteName: "ООО АСТС",
      type: "article",
      publishedTime: article.published_at,
      authors: [article.author],
      images: [
        {
          url: article.main_image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.main_image],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch the article
  const { data: article, error } = await supabase.from("articles").select("*").eq("slug", slug).single()

  if (error || !article) {
    notFound()
  }

  // Increment view count
  await supabase
    .from("articles")
    .update({ views: (article.views || 0) + 1 })
    .eq("id", article.id)

  // Fetch related articles
  const { data: relatedArticles } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .neq("id", article.id)
    .limit(4)
    .order("published_at", { ascending: false })

  const breadcrumbItems = [
    { label: "Главная", href: "/" },
    { label: "Статьи", href: "/stati" },
    { label: article.title },
  ]

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.main_image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: "ООО АСТС",
      logo: {
        "@type": "ImageObject",
        url: "https://asts.vercel.app/images/logo.png",
      },
    },
    datePublished: article.published_at,
    dateModified: article.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://asts.vercel.app/stati/${article.slug}`,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <HeroSection />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <Breadcrumb items={breadcrumbItems} />
          <ArticleClient article={article} relatedArticles={relatedArticles || []} />
        </div>
      </div>
      <Footer />
    </>
  )
}
