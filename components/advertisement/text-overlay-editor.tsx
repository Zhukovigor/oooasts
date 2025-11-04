"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight } from "lucide-react"

interface TextOverlay {
  enabled?: boolean
  text?: string
  x?: number
  y?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  color?: string
  opacity?: number
  backgroundColor?: string
}

interface TextOverlayEditorProps {
  imageUrl: string
  textOverlay: TextOverlay | null
  onChange: (config: TextOverlay) => void
}

export default function TextOverlayEditor({ imageUrl, textOverlay, onChange }: TextOverlayEditorProps) {
  const [config, setConfig] = useState<TextOverlay>(
    textOverlay || {
      enabled: true,
      text: "Ваш текст здесь",
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "center",
      color: "#ffffff",
      opacity: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
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

  const fonts = ["Arial", "Georgia", "Times New Roman", "Verdana", "Courier New", "Comic Sans MS"]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Редактор текста на фото</h2>

      <div className="grid grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">Предпросмотр</label>
          {imageUrl ? (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
              <img src={imageUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              {config.enabled && (
                <div
                  className="absolute"
                  style={{
                    left: `${config.x}%`,
                    top: `${config.y}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: config.backgroundColor,
                    padding: "12px 24px",
                    borderRadius: "8px",
                  }}
                >
                  <p
                    style={{
                      fontSize: `${config.fontSize}px`,
                      fontFamily: config.fontFamily,
                      fontWeight: config.fontWeight,
                      fontStyle: config.fontStyle,
                      textAlign: config.textAlign as any,
                      color: config.color,
                      opacity: config.opacity,
                      margin: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {config.text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-500">
              Загрузите изображение для предпросмотра
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => handleChange("enabled", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Включить текст на фото</span>
          </label>

          {config.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Текст</label>
                <textarea
                  value={config.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Введите текст"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Шрифт</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {fonts.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Размер текста</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={config.fontSize}
                    onChange={(e) => handleChange("fontSize", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">{config.fontSize}px</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Прозрачность</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.opacity}
                    onChange={(e) => handleChange("opacity", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">{Math.round(config.opacity * 100)}%</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Стиль текста</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={config.fontWeight === "bold" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("fontWeight", config.fontWeight === "bold" ? "normal" : "bold")}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={config.fontStyle === "italic" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("fontStyle", config.fontStyle === "italic" ? "normal" : "italic")}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Выравнивание</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={config.textAlign === "left" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("textAlign", "left")}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={config.textAlign === "center" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("textAlign", "center")}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={config.textAlign === "right" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("textAlign", "right")}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет текста</label>
                <input
                  type="color"
                  value={config.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона текста</label>
                <input
                  type="color"
                  value={config.backgroundColor}
                  onChange={(e) => handleChange("backgroundColor", e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Позиция X (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.x}
                    onChange={(e) => handleChange("x", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">{config.x}%</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Позиция Y (%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.y}
                    onChange={(e) => handleChange("y", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-1">{config.y}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
