import type { Metadata } from "next"
import EquipmentEditClient from "./edit-client"

export const metadata: Metadata = {
  title: "Редактировать технику | Админ панель",
  description: "Редактирование спецтехники",
  robots: "noindex, nofollow",
}

export default function EditEquipmentPage({ params }: { params: { id: string } }) {
  return <EquipmentEditClient id={params.id} />
}
