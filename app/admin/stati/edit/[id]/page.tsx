import type { Metadata } from "next"
import ArticleEditClient from "./edit-client"

export const metadata: Metadata = {
  title: "Редактировать статью | Админ панель",
  description: "Редактирование статьи",
  robots: "noindex, nofollow",
}

export default function EditArticlePage({ params }: { params: { id: string } }) {
  return <ArticleEditClient articleId={params.id} />
}
