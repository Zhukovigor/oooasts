import type { ReactNode } from "react"
import AdminSidebar from "@/components/admin-sidebar"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
