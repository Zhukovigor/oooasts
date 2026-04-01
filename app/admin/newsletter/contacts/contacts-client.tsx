"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Plus, Upload, Download, Trash2, X, Mail, Loader2, Search, AlertCircle, CheckCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase-client"
import type { ContactList, ImportResult } from "@/types/contacts"

interface Props {
  initialLists: ContactList[]
}

// Хук для debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function ContactsClient({ initialLists }: Props) {
  const [lists, setLists] = useState<ContactList[]>(initialLists)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedList, setSelectedList] = useState<ContactList | null>(null)
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importTab, setImportTab] = useState<"csv" | "form">("csv")
  const [formInput, setFormInput] = useState("")
  const [formImporting, setFormImporting] = useState(false)
  const [csvSeparator, setCsvSeparator] = useState<"auto" | "," | ";" | "\t">("auto")
  const [loadingStates, setLoadingStates] = useState({
    creating: false,
    deleting: false,
    exporting: false
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [importProgress, setImportProgress] = useState(0)
  const [filteredLists, setFilteredLists] = useState<ContactList[]>(initialLists)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const supabase = createBrowserClient()

  // Фильтрация списков по поисковому запросу
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setFilteredLists(lists)
    } else {
      const filtered = lists.filter(list =>
        list.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        list.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
      setFilteredLists(filtered)
    }
  }, [lists, debouncedSearchTerm])

  // Подтверждение закрытия страницы во время импорта
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (importing || formImporting) {
        e.preventDefault()
        e.returnValue = "Импорт все еще выполняется. Вы уверены, что хотите уйти?"
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [importing, formImporting])

  // Валидация email
  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  // Валидация имени базы контактов
  const validateListName = (name: string): string | null => {
    if (!name.trim()) return "Название базы не может быть пустым"
    if (name.length > 255) return "Название слишком длинное (макс. 255 символов)"
    if (/[<>]/.test(name)) return "Название содержит запрещенные символы"
    return null
  }

  // Обработчик ошибок Supabase
  const handleSupabaseError = (error: any, context: string): string => {
    console.error(`Error in ${context}:`, error)
    
    if (error.code === '23505') {
      return 'Запись уже существует'
    } else if (error.code === '42501') {
      return 'Недостаточно прав для выполнения операции'
    } else if (error.message?.includes('JWT')) {
      return 'Ошибка авторизации. Пожалуйста, войдите снова.'
    } else if (error.code === '42703') {
      return 'Ошибка структуры базы данных. Обратитесь к администратору.'
    } else {
      return error.message || `Ошибка при ${context}`
    }
  }

  // Создание базы контактов
  const handleCreateList = async () => {
    const nameValidation = validateListName(newListName)
    if (nameValidation) {
      alert(nameValidation)
      return
    }

    setLoadingStates(prev => ({ ...prev, creating: true }))

    try {
      const { data, error } = await supabase
        .from("contact_lists")
        .insert({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        })
        .select()
        .single()

      if (error) {
        const errorMessage = handleSupabaseError(error, "создании базы контактов")
        alert(errorMessage)
        return
      }

      setLists(prev => [data, ...prev])
      setNewListName("")
      setNewListDescription("")
      setShowCreateModal(false)
      alert("База контактов успешно создана")
    } catch (error) {
      console.error("Error creating list:", error)
      alert("Неизвестная ошибка при создании базы контактов")
    } finally {
      setLoadingStates(prev => ({ ...prev, creating: false }))
    }
  }

  // Удаление базы контактов
  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить базу "${listName}"? Все контакты будут удалены.`)) {
      return
    }

    setLoadingStates(prev => ({ ...prev, deleting: true }))

    try {
      const { error } = await supabase.from("contact_lists").delete().eq("id", listId)

      if (error) {
        const errorMessage = handleSupabaseError(error, "удалении базы контактов")
        alert(errorMessage)
        return
      }

      setLists(prev => prev.filter((l) => l.id !== listId))
      alert("База контактов успешно удалена")
    } catch (error) {
      console.error("Error deleting list:", error)
      alert("Неизвестная ошибка при удалении базы контактов")
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: false }))
    }
  }

  // Парсинг CSV файла
  const parseCSV = useCallback((text: string, separator: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) {
      throw new Error("Файл пустой или содержит только заголовки")
    }

    // Определяем заголовки
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase())
    
    const contacts = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      // Пропускаем пустые строки и строки только с разделителями
      if (!line || line === separator || line.split(separator).every(cell => !cell.trim())) {
        continue
      }

      try {
        const values = line.split(separator).map(v => v.trim())
        
        // Ищем email в разных колонках
        let email = ""
        let name = null

        const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail')
        const nameIndex = headers.findIndex(h => h === 'name' || h === 'имя' || h === 'название')

        if (emailIndex >= 0 && values[emailIndex]) {
          email = values[emailIndex].toLowerCase()
        } else if (values[0]) {
          email = values[0].toLowerCase() // Первая колонка по умолчанию
        }

        if (nameIndex >= 0 && values[nameIndex]) {
          name = values[nameIndex]
        } else if (values[1]) {
          name = values[1] // Вторая колонка по умолчанию
        }

        if (!email) {
          errors.push(`Строка ${i + 1}: Отсутствует email`)
          continue
        }

        if (!validateEmail(email)) {
          errors.push(`Строка ${i + 1}: Неверный формат email "${email}"`)
          continue
        }

        contacts.push({ email, name, lineNumber: i + 1 })
      } catch (error) {
        errors.push(`Строка ${i + 1}: Ошибка обработки строки`)
      }
    }

    return { contacts, errors }
  }, [validateEmail])

  // Импорт из CSV
  const handleImport = async () => {
    if (!importFile || !selectedList) {
      alert("Выберите файл для импорта")
      return
    }

    // Проверка размера файла (10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (importFile.size > MAX_FILE_SIZE) {
      alert("Файл слишком большой. Максимальный размер: 10MB")
      return
    }

    // Проверка типа файла
    if (importFile.type && !['text/csv', 'text/plain', 'application/vnd.ms-excel'].includes(importFile.type)) {
      alert("Пожалуйста, выберите CSV файл")
      return
    }

    // Проверка лимита контактов
    const MAX_CONTACTS_PER_LIST = 100000
    const currentCount = getContactsCount(selectedList)

    setImporting(true)
    setImportResult(null)
    setImportProgress(0)

    try {
      const text = await importFile.text()
      let separator = csvSeparator
      
      // Автоопределение разделителя
      if (separator === "auto") {
        if (text.includes(";")) separator = ";"
        else if (text.includes("\t")) separator = "\t"
        else separator = ","
      }

      const { contacts, errors: parseErrors } = parseCSV(text, separator)

      if (contacts.length === 0 && parseErrors.length === 0) {
        setImportResult({ success: 0, errors: ["Не найдено валидных контактов для импорта"] })
        return
      }

      // Проверка общего лимита
      if (currentCount + contacts.length > MAX_CONTACTS_PER_LIST) {
        alert(`Превышен лимит контактов. Максимум: ${MAX_CONTACTS_PER_LIST}. Текущее количество: ${currentCount}`)
        return
      }

      const errors = [...parseErrors]
      let successCount = 0
      const successfulEmails = new Set<string>()

      // Импортируем контакты пачками по 50
      const batchSize = 50
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)
        const progress = ((i + batchSize) / contacts.length) * 100
        setImportProgress(Math.min(progress, 100))
        
        // Фильтруем дубликаты в текущей пачке
        const uniqueBatch = batch.filter(contact => !successfulEmails.has(contact.email))
        
        if (uniqueBatch.length === 0) continue
        
        const { error } = await supabase.from("contact_list_contacts").insert(
          uniqueBatch.map(contact => ({
            list_id: selectedList.id,
            email: contact.email,
            name: contact.name,
          }))
        )

        if (error) {
          if (error.code === "23505") {
            // Обрабатываем дубликаты индивидуально
            for (const contact of uniqueBatch) {
              try {
                const { error: singleError } = await supabase
                  .from("contact_list_contacts")
                  .insert({
                    list_id: selectedList.id,
                    email: contact.email,
                    name: contact.name,
                  })

                if (singleError && singleError.code === "23505") {
                  errors.push(`Строка ${contact.lineNumber}: Email "${contact.email}" уже существует в базе`)
                } else if (!singleError) {
                  successCount++
                  successfulEmails.add(contact.email)
                }
              } catch (singleError) {
                errors.push(`Строка ${contact.lineNumber}: Ошибка импорта "${contact.email}"`)
              }
            }
          } else {
            batch.forEach(contact => {
              errors.push(`Строка ${contact.lineNumber}: Ошибка импорта "${contact.email}" - ${error.message}`)
            })
          }
        } else {
          successCount += uniqueBatch.length
          uniqueBatch.forEach(contact => successfulEmails.add(contact.email))
        }

        // Небольшая задержка для избежания перегрузки
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      setImportResult({ success: successCount, errors })
      setImportProgress(100)

      // Обновляем счетчик контактов при успешном импорте
      if (successCount > 0) {
        setLists(prev => prev.map(list => 
          list.id === selectedList.id 
            ? { ...list, contacts_count: (list.contacts_count || 0) + successCount }
            : list
        ))
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({ 
        success: 0, 
        errors: [`Ошибка при чтении файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`] 
      })
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  // Экспорт базы контактов
  const handleExportList = async (list: ContactList) => {
    setLoadingStates(prev => ({ ...prev, exporting: true }))

    try {
      const { data, error } = await supabase
        .from("contact_list_contacts")
        .select("email, name")
        .eq("list_id", list.id)
        .order("created_at", { ascending: true })

      if (error) {
        const errorMessage = handleSupabaseError(error, "экспорте контактов")
        alert(errorMessage)
        return
      }

      if (!data || data.length === 0) {
        alert("В выбранной базе нет контактов для экспорта")
        return
      }

      const csvContent = [
        ["Email", "Name"],
        ...data.map(contact => [contact.email, contact.name || ""])
      ].map(row => row.join(",")).join("\n")

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `contacts_${list.name}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export error:", error)
      alert("Неизвестная ошибка при экспорте")
    } finally {
      setLoadingStates(prev => ({ ...prev, exporting: false }))
    }
  }

  // Импорт через форму
  const handleFormImport = async () => {
    if (!formInput.trim() || !selectedList) {
      alert("Введите контакты для импорта")
      return
    }

    // Проверка лимита контактов
    const MAX_CONTACTS_PER_LIST = 100000
    const currentCount = getContactsCount(selectedList)
    const lines = formInput.split("\n").filter((line) => line.trim())
    
    if (currentCount + lines.length > MAX_CONTACTS_PER_LIST) {
      alert(`Превышен лимит контактов. Максимум: ${MAX_CONTACTS_PER_LIST}. Текущее количество: ${currentCount}`)
      return
    }

    setFormImporting(true)
    setImportResult(null)

    try {
      const lines = formInput.split("\n").filter((line) => line.trim())
      const errors: string[] = []
      let successCount = 0
      const contacts = []

      // Парсим введенные данные
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const parts = line.split(",").map((p) => p.trim())
        const email = parts[0]?.toLowerCase()
        const name = parts[1] || null

        if (!email) {
          errors.push(`Строка ${i + 1}: Отсутствует email`)
          continue
        }

        if (!validateEmail(email)) {
          errors.push(`Строка ${i + 1}: Неверный формат email "${email}"`)
          continue
        }

        contacts.push({ email, name, lineNumber: i + 1 })
      }

      // Импортируем контакты пачками
      const batchSize = 50
      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)
        
        const { error } = await supabase.from("contact_list_contacts").insert(
          batch.map(contact => ({
            list_id: selectedList.id,
            email: contact.email,
            name: contact.name,
          }))
        )

        if (error) {
          if (error.code === "23505") {
            // Обрабатываем дубликаты индивидуально
            for (const contact of batch) {
              try {
                const { error: singleError } = await supabase.from("contact_list_contacts").insert({
                  list_id: selectedList.id,
                  email: contact.email,
                  name: contact.name,
                })

                if (singleError && singleError.code === "23505") {
                  errors.push(`Строка ${contact.lineNumber}: Email "${contact.email}" уже существует в базе`)
                } else if (!singleError) {
                  successCount++
                }
              } catch (singleError) {
                errors.push(`Строка ${contact.lineNumber}: Ошибка импорта "${contact.email}"`)
              }
            }
          } else {
            batch.forEach(contact => {
              errors.push(`Строка ${contact.lineNumber}: Ошибка импорта "${contact.email}"`)
            })
          }
        } else {
          successCount += batch.length
        }

        // Небольшая задержка для избежания перегрузки
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      setImportResult({ success: successCount, errors })

      // Обновляем счетчик и очищаем форму при успешном импорте
      if (successCount > 0) {
        setFormInput("")
        setLists(prev => prev.map(list => 
          list.id === selectedList.id 
            ? { ...list, contacts_count: (list.contacts_count || 0) + successCount }
            : list
        ))
      }
    } catch (error) {
      console.error("Form import error:", error)
      setImportResult({ success: 0, errors: ["Ошибка при обработке контактов"] })
    } finally {
      setFormImporting(false)
    }
  }

  // Закрытие модальных окон
  const closeModals = () => {
    if (importing || formImporting) {
      if (!confirm("Импорт все еще выполняется. Вы уверены, что хотите закрыть?")) {
        return
      }
    }
    
    setShowCreateModal(false)
    setShowImportModal(false)
    setSelectedList(null)
    setNewListName("")
    setNewListDescription("")
    setImportFile(null)
    setFormInput("")
    setImportResult(null)
    setCsvSeparator("auto")
    setImportProgress(0)
  }

  // Получение количества контактов
  const getContactsCount = (list: ContactList) => {
    return list.contacts_count || list.contact_list_contacts?.length || 0
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Базы контактов</h1>
          <p className="text-gray-600">Управление отдельными базами контактов для рассылок</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          disabled={loadingStates.creating}
        >
          {loadingStates.creating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Новая база
        </Button>
      </div>

      {/* Поиск */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredLists.length === 0 ? (
        <Card className="p-8 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lists.length === 0 ? "Нет баз контактов" : "Базы не найдены"}
          </h3>
          <p className="text-gray-600 mb-4">
            {lists.length === 0 
              ? "Создайте новую базу контактов для рассылки" 
              : "Попробуйте изменить поисковый запрос"
            }
          </p>
          {lists.length === 0 && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать базу
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list) => (
            <Card key={list.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate" title={list.name}>{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-gray-600 mt-1 truncate" title={list.description}>
                      {list.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Контактов</p>
                <p className="text-2xl font-bold text-blue-600">{getContactsCount(list)}</p>
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
                  aria-label={`Импорт контактов в базу ${list.name}`}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Импорт
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleExportList(list)}
                  disabled={loadingStates.exporting || getContactsCount(list) === 0}
                  className="flex-1"
                  aria-label={`Экспорт контактов из базы ${list.name}`}
                >
                  {loadingStates.exporting ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  Экспорт
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteList(list.id, list.name)}
                  disabled={loadingStates.deleting}
                  className="text-red-600 hover:bg-red-50"
                  aria-label={`Удалить базу контактов ${list.name}`}
                >
                  {loadingStates.deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно создания базы */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Новая база контактов</h2>
                <Button variant="ghost" size="icon" onClick={closeModals} aria-label="Закрыть">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="list-name">Название базы *</Label>
                  <Input
                    id="list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Например: Экскаваторы"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
                  />
                </div>

                <div>
                  <Label htmlFor="list-description">Описание (опционально)</Label>
                  <Input
                    id="list-description"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Описание базы контактов"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={closeModals}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleCreateList}
                    disabled={loadingStates.creating || !newListName.trim()}
                  >
                    {loadingStates.creating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Создать
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Модальное окно импорта */}
      {showImportModal && selectedList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Импорт контактов в "{selectedList.name}"</h2>
                <Button variant="ghost" size="icon" onClick={closeModals} aria-label="Закрыть">
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
                    {importing && importProgress > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-blue-800">Импорт контактов</span>
                          <span className="text-sm text-blue-600">{Math.round(importProgress)}%</span>
                        </div>
                        <Progress value={importProgress} className="h-2" />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-semibold">Разделитель в CSV файле:</Label>
                      <select
                        value={csvSeparator}
                        onChange={(e) => setCsvSeparator(e.target.value as "auto" | "," | ";" | "\t")}
                        className="w-full mt-2 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={importing}
                      >
                        <option value="auto">Автоопределение (рекомендуется)</option>
                        <option value=",">Запятая (,)</option>
                        <option value=";">Точка с запятой (;)</option>
                        <option value="\t">Табуляция (Tab)</option>
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
                        <label className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer text-center font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                          Выберите файл
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            className="hidden"
                            disabled={importing}
                          />
                        </label>
                        <span className="text-sm text-gray-600 flex-1">
                          {importFile ? `✓ ${importFile.name}` : "Файл не выбран"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Максимальный размер: 10MB</p>
                    </div>

                    {importResult && (
                      <div className="space-y-2">
                        <div className={`p-4 rounded border ${
                          importResult.success > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {importResult.success > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <p className="font-semibold text-green-800">
                              Успешно добавлено: {importResult.success}
                            </p>
                          </div>
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="p-4 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <p className="text-red-800 font-semibold">Ошибки: {importResult.errors.length}</p>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1">
                              {importResult.errors.slice(0, 10).map((error, index) => (
                                <li key={index}>{error}</li>
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
                        onClick={closeModals}
                        disabled={importing}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={!importFile || importing}
                        className="bg-gray-800 hover:bg-gray-900"
                      >
                        {importing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {importing ? "Импорт..." : "Импортировать"}
                      </Button>
                    </div>
                  </>
                )}

                {/* Form Import Tab */}
                {importTab === "form" && (
                  <>
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm text-blue-900 font-semibold mb-2">Добавьте контакты в формате CSV</p>
                      <p className="text-xs text-blue-800">Формат: email, название (опционально)</p>
                      <div className="mt-2 text-xs text-gray-700 font-mono bg-white p-3 rounded border border-blue-200 space-y-1">
                        <p>test@example.com,Компания 1</p>
                        <p>user@test.ru,Компания 2</p>
                        <p>mail@company.com,Компания 3</p>
                        <p>simple@example.com</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Контакты (по одному на строку):</Label>
                      <textarea
                        value={formInput}
                        onChange={(e) => setFormInput(e.target.value)}
                        placeholder={`Формат: email,название\n\nПримеры:\ntest@example.com,Компания 1\nuser@test.ru,Компания 2\nmail@company.com`}
                        className="w-full h-48 mt-2 p-3 border rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                        disabled={formImporting}
                      />
                    </div>

                    {importResult && (
                      <div className="space-y-2">
                        <div className={`p-4 rounded border ${
                          importResult.success > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            {importResult.success > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <p className="font-semibold text-green-800">
                              Успешно добавлено: {importResult.success}
                            </p>
                          </div>
                        </div>
                        {importResult.errors.length > 0 && (
                          <div className="p-4 bg-red-50 rounded border border-red-200 max-h-40 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <p className="text-red-800 font-semibold">Ошибки: {importResult.errors.length}</p>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1">
                              {importResult.errors.slice(0, 10).map((error, index) => (
                                <li key={index}>{error}</li>
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
                        onClick={closeModals}
                        disabled={formImporting}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleFormImport}
                        disabled={!formInput.trim() || formImporting}
                        className="bg-gray-800 hover:bg-gray-900"
                      >
                        {formImporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        {formImporting ? "Импорт..." : "Импортировать"}
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
