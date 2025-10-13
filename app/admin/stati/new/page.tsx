import type { Metadata } from "next"
import ArticleFormClient from "./client"

export const metadata: Metadata = {
  title: "Создать статью | Админ панель ООО АСТС",
  description: "Форма для создания новых статей",
  robots: "noindex, nofollow",
}

export default function NewArticlePage() {
  return <ArticleFormClient />
}
