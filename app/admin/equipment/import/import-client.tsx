"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Upload, FileJson, FileCode, AlertCircle, CheckCircle2, Code2, Info } from "lucide-react"

export default function ImportEquipmentClient() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null)
  const [importType, setImportType] = useState<"json" | "sql">("json")
  const [inputMethod, setInputMethod] = useState<"file" | "manual">("file")
  const [manualCode, setManualCode] = useState("")
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data } = await supabase
        .from("catalog_categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name")

      if (data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  const handleManualImport = async () => {
    if (!manualCode.trim()) {
      setResult({
        success: false,
        message: "Введите код для импорта",
      })
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      if (importType === "json") {
        // Parse JSON
        const equipment = JSON.parse(manualCode)
        if (!Array.isArray(equipment)) {
          throw new Error("JSON должен содержать массив техники")
        }

        const categoryIds = new Set(categories.map((c) => c.id))
        const invalidItems = equipment.filter((item: any) => !categoryIds.has(item.category_id))

        if (invalidItems.length > 0) {
          throw new Error(
            `Найдены недействительные category_id. Используйте ID из списка доступных категорий ниже. Проблемные записи: ${invalidItems.length}`,
          )
        }

        // Insert equipment
        const { data, error } = await supabase.from("catalog_models").insert(
          equipment.map((item: any) => ({
            category_id: item.category_id,
            name: item.name,
            slug: item.slug,
            model_code: item.model_code || null,
            description: item.description,
            main_image: item.main_image || null,
            images: item.images || [],
            working_weight: item.working_weight || null,
            bucket_volume: item.bucket_volume || null,
            max_digging_depth: item.max_digging_depth || null,
            max_reach: item.max_reach || null,
            engine_manufacturer: item.engine_manufacturer || null,
            engine_power: item.engine_power || null,
            engine_model: item.engine_model || null,
            specifications: item.specifications || {},
            price: item.price || null,
            is_active: item.is_active !== false,
            sort_order: item.sort_order || 0,
          })),
        )

        if (error) throw error

        setResult({
          success: true,
          message: "Спецтехника успешно импортирована",
          count: equipment.length,
        })
        setManualCode("")
      } else {
        // SQL import
        setResult({
          success: false,
          message: "SQL импорт временно недоступен. Используйте JSON формат.",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Ошибка при импорте",
      })
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      if (importType === "json") {
        // Parse JSON
        const equipment = JSON.parse(text)
        if (!Array.isArray(equipment)) {
          throw new Error("JSON должен содержать массив техники")
        }

        const categoryIds = new Set(categories.map((c) => c.id))
        const invalidItems = equipment.filter((item: any) => !categoryIds.has(item.category_id))

        if (invalidItems.length > 0) {
          throw new Error(
            `Найдены недействительные category_id. Используйте ID из списка доступных категорий ниже. Проблемные записи: ${invalidItems.length}`,
          )
        }

        // Insert equipment
        const { data, error } = await supabase.from("catalog_models").insert(
          equipment.map((item: any) => ({
            category_id: item.category_id,
            name: item.name,
            slug: item.slug,
            model_code: item.model_code || null,
            description: item.description,
            main_image: item.main_image || null,
            images: item.images || [],
            working_weight: item.working_weight || null,
            bucket_volume: item.bucket_volume || null,
            max_digging_depth: item.max_digging_depth || null,
            max_reach: item.max_reach || null,
            engine_manufacturer: item.engine_manufacturer || null,
            engine_power: item.engine_power || null,
            engine_model: item.engine_model || null,
            specifications: item.specifications || {},
            price: item.price || null,
            is_active: item.is_active !== false,
            sort_order: item.sort_order || 0,
          })),
        )

        if (error) throw error

        setResult({
          success: true,
          message: "Спецтехника успешно импортирована",
          count: equipment.length,
        })
      } else {
        // SQL import
        setResult({
          success: false,
          message: "SQL импорт временно недоступен. Используйте JSON формат.",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Ошибка при импорте",
      })
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Импорт спецтехники</h1>
        <p className="text-gray-600">
          Загрузите файл или вставьте код JSON/SQL для массового импорта техники в каталог
        </p>
      </div>

      {categories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Доступные категории для импорта:</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white rounded p-2 text-sm">
                    <div className="font-mono text-xs text-gray-600 mb-1">{cat.id}</div>
                    <div className="font-medium text-gray-900">
                      {cat.name} <span className="text-gray-500">({cat.slug})</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-blue-700 mt-3">
                ⚠️ Используйте эти ID в поле <code className="bg-blue-100 px-1 rounded">category_id</code> при импорте
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Выберите формат импорта</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setImportType("json")}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              importType === "json" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <FileJson className={`w-8 h-8 ${importType === "json" ? "text-blue-600" : "text-gray-400"}`} />
            <div className="text-left">
              <div className="font-semibold text-gray-900">JSON формат</div>
              <div className="text-sm text-gray-600">Рекомендуется для импорта</div>
            </div>
          </button>

          <button
            onClick={() => setImportType("sql")}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              importType === "sql" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <FileCode className={`w-8 h-8 ${importType === "sql" ? "text-blue-600" : "text-gray-400"}`} />
            <div className="text-left">
              <div className="font-semibold text-gray-900">SQL формат</div>
              <div className="text-sm text-gray-600">Временно недоступен</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setInputMethod("file")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              inputMethod === "file"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Загрузить файл
          </button>
          <button
            onClick={() => setInputMethod("manual")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              inputMethod === "manual"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Code2 className="w-4 h-4 inline-block mr-2" />
            Вставить код
          </button>
        </div>

        <div className="p-6">
          {inputMethod === "file" ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="mb-2 text-sm text-gray-700">
                  <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                </p>
                <p className="text-xs text-gray-500">
                  {importType === "json" ? "JSON файл (до 10MB)" : "SQL файл (до 10MB)"}
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={importType === "json" ? ".json" : ".sql"}
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вставьте {importType === "json" ? "JSON" : "SQL"} код:
                </label>
                <textarea
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={
                    importType === "json"
                      ? `[\n  {\n    "category_id": "${categories[0]?.id || "uuid-категории"}",\n    "name": "Название",\n    ...\n  }\n]`
                      : "INSERT INTO catalog_models ..."
                  }
                  className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={importing}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Вы можете редактировать код прямо в этом поле перед импортом
                </p>
              </div>
              <button
                onClick={handleManualImport}
                disabled={importing || !manualCode.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? "Импортируем..." : "Импортировать"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`rounded-lg p-4 flex items-start gap-3 ${
            result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-medium ${result.success ? "text-green-900" : "text-red-900"}`}>{result.message}</p>
            {result.count && <p className="text-sm text-green-700 mt-1">Импортировано единиц: {result.count}</p>}
          </div>
        </div>
      )}

      {/* Loading State */}
      {importing && (
        <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-900 font-medium">Импортируем технику...</span>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-3">Формат JSON файла:</h3>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-sm">
          {`[
  {
    "category_id": "${categories[0]?.id || "uuid-категории-из-списка-выше"}",
    "name": "Название техники",
    "slug": "nazvanie-tehniki",
    "model_code": "Код модели",
    "description": "Описание",
    "main_image": "URL главного изображения",
    "images": ["URL1", "URL2"],
    "working_weight": 15000,
    "specifications": {},
    "price": 5000000,
    "is_active": true
  }
]`}
        </pre>
      </div>
    </div>
  )
}
