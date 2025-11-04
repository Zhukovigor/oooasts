"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Upload, Download } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface CollageConfig {
  mode?: "1x1" | "2x1" | "3x1" | "2x2"
  skewAngle?: number
  images?: string[]
  spacing?: number
  borderRadius?: number
  backgroundColor?: string
}

interface CollageEditorProps {
  collageConfig: CollageConfig | null
  onChange: (config: CollageConfig) => void
}

export default function CollageEditor({ collageConfig, onChange }: CollageEditorProps) {
  const [config, setConfig] = useState<CollageConfig>(
    collageConfig || {
      mode: "2x1",
      skewAngle: 15,
      images: [],
      spacing: 8,
      borderRadius: 12,
      backgroundColor: "#ffffff",
    },
  )

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  const handleChange = useCallback((key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const handleImageChange = useCallback((index: number, value: string) => {
    const newImages = [...(config.images || [])]
    newImages[index] = value
    setConfig((prev) => ({
      ...prev,
      images: newImages,
    }))
  }, [config.images])

  const addImage = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      images: [...(prev.images || []), ""],
    }))
  }, [])

  const removeImage = useCallback((index: number) => {
    setConfig((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }))
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[], index: number) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadingIndex(index)
    
    try {
      // Здесь должна быть логика загрузки на ваш CDN/сервер
      // Для демо используем Data URL
      const reader = new FileReader()
      reader.onload = () => {
        handleImageChange(index, reader.result as string)
        setUploadingIndex(null)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading image:", error)
      setUploadingIndex(null)
    }
  }, [handleImageChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => onDrop(files, config.images?.length || 0),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
  })

  const maxImages = {
    "1x1": 1,
    "2x1": 2,
    "3x1": 3,
    "2x2": 4,
  }[config.mode || "2x1"]

  const getGridTemplate = () => {
    switch (config.mode) {
      case "1x1": return "1fr"
      case "2x1": return "1fr 1fr"
      case "3x1": return "1fr 1fr 1fr"
      case "2x2": return "1fr 1fr / 1fr 1fr"
      default: return "1fr 1fr"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Редактор коллажа</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            // Сброс к значениям по умолчанию
            setConfig({
              mode: "2x1",
              skewAngle: 15,
              images: [],
              spacing: 8,
              borderRadius: 12,
              backgroundColor: "#ffffff",
            })
          }}
        >
          Сбросить
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">Предпросмотр коллажа</label>
          <div 
            className="bg-gray-100 rounded-lg p-6 flex items-center justify-center border-2 border-dashed border-gray-300"
            style={{ 
              aspectRatio: "16/9",
              backgroundColor: config.backgroundColor 
            }}
          >
            <div 
              className="h-full w-full flex gap-2 relative overflow-hidden"
              style={{
                display: "grid",
                gridTemplate: getGridTemplate(),
                gap: `${config.spacing}px`,
                borderRadius: `${config.borderRadius}px`,
              }}
            >
              {Array.from({ length: maxImages }).map((_, idx) => {
                const imageUrl = config.images?.[idx]
                return (
                  <div
                    key={idx}
                    className="bg-gray-200 rounded overflow-hidden relative flex items-center justify-center"
                    style={{
                      transform: config.mode === "2x1" && idx === 0 ? `skewY(${config.skewAngle}deg)` : 
                                config.mode === "2x1" && idx === 1 ? `skewY(-${config.skewAngle}deg)` : "none",
                      transformOrigin: "center",
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Collage ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-sm text-center p-4">
                        <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mb-2 mx-auto">
                          <span className="text-xs font-bold">{idx + 1}</span>
                        </div>
                        Фото {idx + 1}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Информация о режиме */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              Режим: {config.mode} • Фото: {config.images?.filter(img => img).length || 0}/{maxImages}
            </p>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-6">
          {/* Режим коллажа */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Режим коллажа</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { mode: "1x1", label: "1 фото", icon: "□" },
                { mode: "2x1", label: "2 фото", icon: "◫" },
                { mode: "3x1", label: "3 фото", icon: "◫◫" },
                { mode: "2x2", label: "4 фото", icon: "◫◫" },
              ] as const).map(({ mode, label, icon }) => (
                <Button
                  key={mode}
                  type="button"
                  variant={config.mode === mode ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => {
                    const maxImages = {
                      "1x1": 1,
                      "2x1": 2,
                      "3x1": 3,
                      "2x2": 4,
                    }[mode]
                    
                    const images = (config.images || []).slice(0, maxImages)
                    setConfig((prev) => ({
                      ...prev,
                      mode,
                      images,
                    }))
                  }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Настройки внешнего вида */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Отступ между фото</label>
              <input
                type="range"
                min="0"
                max="20"
                value={config.spacing}
                onChange={(e) => handleChange("spacing", Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">{config.spacing}px</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Скругление углов</label>
              <input
                type="range"
                min="0"
                max="24"
                value={config.borderRadius}
                onChange={(e) => handleChange("borderRadius", Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">{config.borderRadius}px</p>
            </div>
          </div>

          {/* Угол наклона (только для режима 2x1) */}
          {config.mode === "2x1" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Угол наклона линии: {config.skewAngle}°
              </label>
              <div className="flex gap-2">
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={config.skewAngle}
                  onChange={(e) => handleChange("skewAngle", Number(e.target.value))}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Отрицательное значение = наклон влево, положительное = вправо
              </p>
            </div>
          )}

          {/* Цвет фона */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона коллажа</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => handleChange("backgroundColor", e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={config.backgroundColor}
                onChange={(e) => handleChange("backgroundColor", e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Управление изображениями */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Изображения</label>
              <span className="text-sm text-gray-500">
                {config.images?.filter(img => img).length || 0}/{maxImages}
              </span>
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: maxImages }).map((_, idx) => {
                const imageUrl = config.images?.[idx] || ""
                return (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => handleImageChange(idx, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={`https://example.com/photo-${idx + 1}.jpg`}
                      />
                      <div className="flex gap-2">
                        <div
                          {...getRootProps()}
                          className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-2 text-center cursor-pointer hover:border-blue-400 transition-colors"
                        >
                          <input {...getInputProps()} />
                          <Upload className="w-4 h-4 mx-auto mb-1" />
                          <span className="text-xs text-gray-600">
                            {isDragActive ? "Отпустите файл..." : "Перетащите или кликните"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeImage(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                        disabled={uploadingIndex === idx}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {uploadingIndex === idx && (
                      <div className="flex items-center justify-center mt-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {(config.images?.length || 0) < maxImages && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={addImage}
                className="w-full mt-3 bg-transparent border-2 border-dashed border-gray-300 hover:border-blue-400"
                disabled={uploadingIndex !== null}
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить слот для фото
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
