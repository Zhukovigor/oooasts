import type { Metadata } from "next"
import EquipmentListClient from "./list-client"

export const metadata: Metadata = {
  title: "Управление спецтехникой | Админ панель",
  description: "Список всей спецтехники в каталоге",
  robots: "noindex, nofollow",
}

export default function EquipmentListPage() {
  return <EquipmentListClient />
}
