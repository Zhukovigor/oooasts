import type { Metadata } from "next"
import ImportArticlesClient from "./import-client"

export const metadata: Metadata = {
  title: "Импорт статей | Админ панель",
  robots: "noindex, nofollow",
}

export default function ImportArticlesPage() {
  return <ImportArticlesClient />
}
