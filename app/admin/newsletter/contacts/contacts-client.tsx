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
  const [importTab, setImportTab] = useState<"csv" | "form">("csv")
  const [formInput, setFormInput] = useState("")
  const [formImporting, setFormImporting] = useState(false)
  const [csvSeparator, setCsvSeparator] = useState<"auto" | "," | ";" | "\t">("auto")

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
      let separator = csvSeparator
      if (separator === "auto") {
        separator = text.includes(";") ? ";" : text.includes("\t") ? "\t" : ","
      }

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
          const parts = line.split(separator).map((p) => p.trim())
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

  const handleFormImport = async () => {
    if (!formInput.trim() || !selectedList) {
      alert("Введите контакты для импорта")
      return
    }

    setFormImporting(true)
    setImportResult(null)

    try {
      const lines = formInput.split("\n").filter((line) => line.trim())
      const errors: string[] = []
      let successCount = 0

      for (let i = 0; i < lines.length; i++) {
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

      if (successCount > 0) {
        setFormInput("")
        setLists(
          lists.map((l) =>
            l.id === selectedList.id
              ? { ...l, contact_list_contacts: [...(l.contact_list_contacts || []), ...Array(successCount).fill({})] }
              : l,
          ),
        )
      }

      setImportResult({ success: successCount, errors })
    } catch (error) {
      console.error("Form import error:", error)
      setImportResult({ success: 0, errors: ["Ошибка при обработке контактов"] })
    } finally {
      setFormImporting(false)
    }
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Импорт подписчиков</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                    setFormInput("")
                    setImportResult(null)
                    setCsvSeparator("auto")
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => {
                    setImportTab("csv")
                    setImportResult(null)
                  }}
                  className={`pb-3 px-4 font-semibold transition-colors flex items-center gap-2 ${
                    importTab === "csv"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Загрузить CSV
                </button>
                <button
                  onClick={() => {
                    setImportTab("form")
                    setImportResult(null)
                  }}
                  className={`pb-3 px-4 font-semibold transition-colors flex items-center gap-2 ${
                    importTab === "form"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Через форму
                </button>
              </div>

              <div className="space-y-4">
                {/* CSV Import Tab */}
                {importTab === "csv" && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold">Раздельность в CSV файле:</Label>
                      <select
                        value={csvSeparator}
                        onChange={(e) => setCsvSeparator(e.target.value as "auto" | "," | ";" | "\t")}
                        className="w-full mt-2 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="auto">Автоопределение (рекомендуется)</option>
                        <option value=",">,запятая</option>
                        <option value=";">точка с запятой</option>
                        <option value="\t">Tab</option>
                      </select>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-900 mb-3 font-semibold">
                        Загрузите CSV файл. Поддерживаются файлы с колонками на русском или английском.
                      </p>
                      <div className="space-y-2 text-xs text-blue-800 font-mono bg-white p-3 rounded border border-blue-200">
                        <p className="font-bold text-gray-700">Английские заголовки:</p>
                        <p>Email,Name,Status,Date</p>
                        <p>test@example.com,Company Name,active,2024-01-01</p>
                        <p className="mt-3 font-bold text-gray-700">Русские заголовки:</p>
                        <p>Email,Имя,Статус,Дата</p>
                        <p>test@example.com,Название компании,Активен,2024-01-01</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Выберите файл:</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <label className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer text-center font-medium text-sm transition">
                          Выберите файл
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                        </label>
                        <span className="text-sm text-gray-600 flex-1">
                          {importFile ? `✓ ${importFile.name}` : "Файл не выбран"}
                        </span>
                      </div>
                    </div>

                    {importResult && (
                      <div className="space-y-2">
                        <div className="p-4 bg-green-50 rounded border border-green-200">
                          <p className="text-green-800 font-semibold">Успешно добавлено: {importResult.success}</p>
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="p-4 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                            <p className="text-red-800 font-semibold mb-2">Ошибки: {importResult.errors.length}</p>
                            <ul className="text-xs text-red-700 space-y-1">
                              {importResult.errors.slice(0, 10).map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                              {importResult.errors.length > 10 && (
                                <li>...и еще {importResult.errors.length - 10} ошибок</li>
                              )}
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
                          setCsvSeparator("auto")
                        }}
                        disabled={importing}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className="bg-gray-800 hover:bg-gray-900"
                      >
                        {importing ? "Импортировать..." : "Импортировать"}
                      </Button>
                    </div>
                  </>
                )}

                {/* Form Import Tab */}
                {importTab === "form" && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-900 font-semibold mb-2">Добавьте несколько телефонных номеров</p>
                      <p className="text-xs text-blue-800">Подтвердить пример:</p>
                      <div className="mt-2 text-xs text-gray-700 font-mono bg-white p-3 rounded border border-blue-200 space-y-1">
                        <p>test@example.com,Компания 1</p>
                        <p>user@test.ru,Компания 2</p>
                        <p>mail@company.com,Компания 3</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Контакты (по одному на строку):</Label>
                      <textarea
                        value={formInput}
                        onChange={(e) => setFormInput(e.target.value)}
                        placeholder={`Формат: email,название\n\nПримеры:\ntest@example.com,Компания 1\nuser@test.ru,Компания 2`}
                        className="w-full h-48 mt-2 p-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {importResult && (
                      <div className="space-y-2">
                        <div className="p-4 bg-green-50 rounded border border-green-200">
                          <p className="text-green-800 font-semibold">Успешно добавлено: {importResult.success}</p>
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="p-4 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                            <p className="text-red-800 font-semibold mb-2">Ошибки: {importResult.errors.length}</p>
                            <ul className="text-xs text-red-700 space-y-1">
                              {importResult.errors.slice(0, 10).map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                              {importResult.errors.length > 10 && (
                                <li>...и еще {importResult.errors.length - 10} ошибок</li>
                              )}
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
                          setFormInput("")
                          setImportResult(null)
                        }}
                        disabled={formImporting}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleFormImport}
                        disabled={!formInput.trim() || formImporting}
                        className="bg-gray-800 hover:bg-gray-900"
                      >
                        {formImporting ? "Импортировать..." : "Импортировать"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
