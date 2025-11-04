"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Plus } from "lucide-react"

interface CollageConfig {
  mode?: "1x1" | "2x1" | "3x1"
  skewAngle?: number
  images?: string[]
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
    },
  )

  useEffect(() => {
    onChange(config)
  }, [config])

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...(config.images || [])]
    newImages[index] = value
    setConfig((prev) => ({
      ...prev,
      images: newImages,
    }))
  }

  const addImage = () => {
    setConfig((prev) => ({
      ...prev,
      images: [...(prev.images || []), ""],
    }))
  }

  const removeImage = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }))
  }

  const maxImages = config.mode === "1x1" ? 1 : config.mode === "2x1" ? 2 : 3

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Редактор коллажа</h2>

      <div className="grid grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">Предпросмотр</label>
          <div className="bg-gray-100 rounded-lg p-4" style={{ aspectRatio: "16/9" }}>
            <div className="h-full flex gap-2 relative overflow-hidden rounded">
              {config.images?.map((img, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-gray-200 rounded overflow-hidden relative"
                  style={{
                    transform: idx < config.images!.length - 1 ? `skewY(${config.skewAngle}deg)` : "none",
                  }}
                >
                  {img ? (
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`Collage ${idx}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      Фото {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Режим коллажа</label>
            <div className="grid grid-cols-3 gap-2">
              {(["1x1", "2x1", "3x1"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={config.mode === mode ? "default" : "outline"}
                  onClick={() => {
                    const maxImages = mode === "1x1" ? 1 : mode === "2x1" ? 2 : 3
                    const images = (config.images || []).slice(0, maxImages)
                    setConfig((prev) => ({
                      ...prev,
                      mode,
                      images,
                    }))
                  }}
                >
                  {mode === "1x1" && "1 фото"}
                  {mode === "2x1" && "2 фото"}
                  {mode === "3x1" && "3 фото"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Угол наклона линии (°)</label>
            <div className="flex gap-2">
              <input
                type="range"
                min="-45"
                max="45"
                value={config.skewAngle}
                onChange={(e) => handleChange("skewAngle", Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-700 w-12 text-right">{config.skewAngle}°</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">Отрицательное значение = наклон влево, положительное = вправо</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
            <div className="space-y-2">
              {config.images?.slice(0, maxImages).map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => handleImageChange(idx, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`URL фото ${idx + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeImage(idx)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {(config.images?.length || 0) < maxImages && (
                <Button type="button" variant="outline" onClick={addImage} className="w-full bg-transparent">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить фото
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
