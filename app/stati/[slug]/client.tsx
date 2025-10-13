"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, Eye, User, Tag, Share2, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  main_image: string
  author: string
  category: string
  tags: string[]
  views: number
  read_time: number
  published_at: string
}

interface ArticleClientProps {
  article: Article
  relatedArticles: Article[]
}

export default function ArticleClient({ article, relatedArticles }: ArticleClientProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Article Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="mb-8">
          {article.category && (
            <span className="inline-block bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-bold mb-4">
              {article.category}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
            <span className="flex items-center gap-2">
              <User size={18} />
              <span className="font-medium">{article.author}</span>
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={18} />
              {new Date(article.published_at).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={18} />
              {article.read_time} мин чтения
            </span>
            <span className="flex items-center gap-2">
              <Eye size={18} />
              {article.views} просмотров
            </span>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Tag size={18} className="text-gray-600" />
              {article.tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <Button onClick={handleShare} variant="outline" className="gap-2 bg-transparent">
            <Share2 size={18} />
            Поделиться
          </Button>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
          <Image
            src={article.main_image || "/placeholder.svg?height=500&width=800"}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Article Content */}
        <div
          className="prose prose-lg max-w-none mb-12
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
            prose-strong:text-gray-900 prose-strong:font-bold
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
            prose-ul:my-6 prose-ol:my-6
            prose-li:text-gray-700 prose-li:my-2"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </motion.div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 pt-12 border-t border-gray-200"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Читайте также</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <Link key={relatedArticle.id} href={`/stati/${relatedArticle.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 h-full">
                  <div className="relative h-48">
                    <Image
                      src={relatedArticle.main_image || "/placeholder.svg?height=300&width=400"}
                      alt={relatedArticle.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{relatedArticle.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{relatedArticle.excerpt}</p>
                    <span className="text-blue-600 font-semibold text-sm flex items-center gap-2">
                      Читать далее <ArrowRight size={16} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white"
      >
        <h3 className="text-2xl font-bold mb-4">Нужна консультация по спецтехнике?</h3>
        <p className="text-lg mb-6 opacity-90">
          Наши эксперты помогут подобрать оптимальное решение для вашего бизнеса
        </p>
        <Link href="/#application">
          <Button size="lg" variant="secondary" className="font-bold">
            Оставить заявку
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}
