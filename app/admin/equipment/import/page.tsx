import type { Metadata } from "next"
import ImportEquipmentClient from "./import-client"

export const metadata: Metadata = {
  title: "Импорт спецтехники | Админ панель",
  robots: "noindex, nofollow",
}

export default function ImportEquipmentPage() {
  return <ImportEquipmentClient />
}
