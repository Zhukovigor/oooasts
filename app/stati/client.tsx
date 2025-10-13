"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, Eye, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  main_image: string
  author: string
  category: string
  tags: string[]
  views: number
  read_time: number
  published_at: string
  featured: boolean
}

interface ArticlesClientProps {
  articles: Article[]
}

export default function ArticlesClient({ articles }: ArticlesClientProps) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-600">Статьи скоро появятся. Следите за обновлениями!</p>
      </div>
    )
  }

  const featuredArticles = articles.filter((article) => article.featured).slice(0, 2)
  const regularArticles = articles.filter((article) => !article.featured)

  return (
    <div className="space-y-12">
      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Рекомендуемые статьи</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/stati/${article.slug}`}>
                  <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-blue-100 hover:border-blue-300 h-full">
                    <div className="relative h-80">
                      <Image
                        src={article.main_image || "/placeholder.svg?height=400&width=600"}
                        alt={article.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                          Рекомендуем
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} />
                          {new Date(article.published_at).toLocaleDateString("ru-RU")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} />
                          {article.read_time} мин
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {article.views}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">{article.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{article.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-600 font-semibold">{article.category}</span>
                        <span className="text-blue-600 font-semibold flex items-center gap-2">
                          Читать далее <ArrowRight size={18} />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Articles Grid - 4 per row */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Все статьи</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {regularArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Link href={`/stati/${article.slug}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 h-full flex flex-col">
                  <div className="relative h-48">
                    <Image
                      src={article.main_image || "/placeholder.svg?height=300&width=400"}
                      alt={article.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    {article.category && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                          {article.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(article.published_at).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {article.read_time} мин
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 flex-grow">{article.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Eye size={14} />
                        {article.views}
                      </span>
                      <span className="text-blue-600 font-semibold text-sm flex items-center gap-1">
                        Читать <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
