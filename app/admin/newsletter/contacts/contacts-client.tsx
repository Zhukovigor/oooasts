"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Upload, Download, Trash2, X, Mail } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"

interface ContactList {
  id: string
  name: string
  description: string | null
  created_at: string
  contact_list_contacts: Array<{ id: string }>
}

interface Props {
  initialLists: ContactList[]
}

export default function ContactsClient({ initialLists }: Props) {
  const [lists, setLists] = useState(initialLists)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedList, setSelectedList] = useState<ContactList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)

  const supabase = createBrowserClient()

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      alert("Введите название базы контактов")
      return
    }

    const { data, error } = await supabase
      .from("contact_lists")
      .insert({
        name: newListName,
        description: newListDescription || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating list:", error)
      alert("Ошибка при создании базы контактов")
      return
    }

    setLists([data, ...lists])
    setNewListName("")
    setNewListDescription("")
    setShowCreateModal(false)
    alert("База контактов успешно создана")
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить базу "${listName}"? Все контакты будут удалены.`)) {
      return
    }

    const { error } = await supabase.from("contact_lists").delete().eq("id", listId)

    if (error) {
      console.error("Error deleting list:", error)
      alert("Ошибка при удалении базы контактов")
      return
    }

    setLists(lists.filter((l) => l.id !== listId))
    alert("База контактов успешно удалена")
  }

  const handleImport = async () => {
    if (!importFile || !selectedList) {
      alert("Выберите файл для импорта")
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const text = await importFile.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        setImportResult({ success: 0, errors: ["Файл пустой"] })
        return
      }

      const errors: string[] = []
      let successCount = 0

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          const parts = line.split(",").map((p) => p.trim())
          const email = parts[0]?.toLowerCase()
          const name = parts[1] || null

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Строка ${i + 1}: Неверный email`)
            continue
          }

          const { error } = await supabase.from("contact_list_contacts").insert({
            list_id: selectedList.id,
            email,
            name,
          })

          if (error) {
            if (error.code === "23505") {
              errors.push(`Строка ${i + 1}: Email "${email}" уже в базе`)
            } else {
              errors.push(`Строка ${i + 1}: Ошибка "${email}"`)
            }
          } else {
            successCount++
          }
        } catch (error) {
          errors.push(`Строка ${i + 1}: Ошибка обработки`)
        }
      }

      setImportResult({ success: successCount, errors })
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ success: 0, errors: ["Ошибка при чтении файла"] })
    } finally {
      setImporting(false)
    }
  }

  const handleExportList = async (list: ContactList) => {
    const { data, error } = await supabase.from("contact_list_contacts").select("email, name").eq("list_id", list.id)

    if (error) {
      alert("Ошибка при экспорте")
      return
    }

    const csv = [["Email", "Название"].join(","), ...data.map((c) => [c.email, c.name || ""].join(","))].join("\n")

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `contacts_${list.name}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Базы контактов</h1>
          <p className="text-gray-600">Управление отдельными базами контактов для рассылок</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Новая база
        </Button>
      </div>

      {lists.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет баз контактов</h3>
          <p className="text-gray-600 mb-4">Создайте новую базу контактов для рассылки</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Создать базу
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card key={list.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">{list.name}</h3>
                  {list.description && <p className="text-sm text-gray-600 mt-1">{list.description}</p>}
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Контактов</p>
                <p className="text-2xl font-bold text-blue-600">{list.contact_list_contacts?.length || 0}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedList(list)
                    setShowImportModal(true)
                  }}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Импорт
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportList(list)} className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Экспорт
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteList(list.id, list.name)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Новая база контактов</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Название базы *</Label>
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Например: Экскаваторы"
                  />
                </div>

                <div>
                  <Label>Описание (опционально)</Label>
                  <Input
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Описание базы контактов"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleCreateList}>Создать</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showImportModal && selectedList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Импорт контактов в "{selectedList.name}"</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setImportResult(null)
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Загрузите CSV файл</Label>
                  <p className="text-xs text-gray-500 mb-2">Формат: Email,Название</p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700"
                  />
                  {importFile && <p className="text-sm text-green-600 mt-2">✓ {importFile.name}</p>}
                </div>

                {importResult && (
                  <div className="space-y-2">
                    <div className="p-4 bg-green-50 rounded">
                      <p className="text-green-800 font-semibold">Успешно: {importResult.success}</p>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="p-4 bg-red-50 rounded max-h-40 overflow-y-auto">
                        <p className="text-red-800 font-semibold mb-2">Ошибки: {importResult.errors.length}</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {importResult.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowImportModal(false)
                      setImportFile(null)
                      setImportResult(null)
                    }}
                    disabled={importing}
                  >
                    Закрыть
                  </Button>
                  <Button onClick={handleImport} disabled={!importFile || importing}>
                    {importing ? "Импорт..." : "Импортировать"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
