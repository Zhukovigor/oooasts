import type { Metadata } from "next"
import ArticleListClient from "./list-client"

export const metadata: Metadata = {
  title: "Управление статьями | Админ панель",
  description: "Список всех статей",
  robots: "noindex, nofollow",
}

export default function ArticlesListPage() {
  return <ArticleListClient />
}
