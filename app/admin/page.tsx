import type { Metadata } from "next"
import AdminDashboard from "./dashboard-client"

export const metadata: Metadata = {
  title: "Админ панель | ООО АСТС",
  description: "Панель управления контентом сайта",
  robots: "noindex, nofollow",
}

export default function AdminPage() {
  return <AdminDashboard />
}
