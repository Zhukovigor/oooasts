import type { ReactNode } from "react"
import AdminSidebar from "@/components/admin-sidebar"
import AdminAuth from "@/components/admin-auth"

// Force all admin pages to be dynamically rendered
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuth>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminAuth>
  )
}
