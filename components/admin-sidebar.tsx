"use client"

import { useState } from "react"
import Link from "link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Package, Menu, X, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [articlesExpanded, setArticlesExpanded] = useState(true)
  const [equipmentExpanded, setEquipmentExpanded] = useState(true)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-transparent"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Админ панель</h2>
            <p className="text-sm text-gray-600 mt-1">ООО АСТС</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Dashboard */}
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive("/admin") ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Главная</span>
            </Link>

            {/* Articles Section */}
            <div>
              <button
                onClick={() => setArticlesExpanded(!articlesExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Статьи</span>
                </div>
                {articlesExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {articlesExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    href="/admin/stati"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/stati") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Все статьи
                  </Link>
                  <Link
                    href="/admin/stati/new"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/stati/new") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Создать статью
                  </Link>
                  <Link
                    href="/admin/stati/import"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/stati/import") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Импорт статей
                  </Link>
                </div>
              )}
            </div>

            {/* Equipment Section */}
            <div>
              <button
                onClick={() => setEquipmentExpanded(!equipmentExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Спецтехника</span>
                </div>
                {equipmentExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {equipmentExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    href="/admin/equipment"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/equipment") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Вся техника
                  </Link>
                  <Link
                    href="/admin/equipment/new"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/equipment/new") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Добавить технику
                  </Link>
                  <Link
                    href="/admin/equipment/import"
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      isActive("/admin/equipment/import")
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Импорт техники
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Вернуться на сайт
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
