import type { Metadata } from "next"
import EquipmentFormClient from "./form-client"

export const metadata: Metadata = {
  title: "Добавить технику | Админ панель",
  description: "Добавление новой спецтехники в каталог",
  robots: "noindex, nofollow",
}

export default function NewEquipmentPage() {
  return <EquipmentFormClient />
}
