"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Palette } from "lucide-react"

interface TextOverlay {
  enabled?: boolean
  text?: string
  x?: number
  y?: number
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  color?: string
  opacity?: number
  backgroundColor?: string
  backgroundOpacity?: number
  padding?: number
  borderRadius?: number
  maxWidth?: number
  rotation?: number
  lineHeight?: number
  shadow?: {
    enabled?: boolean
    color?: string
    blur?: number
    offsetX?: number
    offsetY?: number
  }
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
      fontSize: 24,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textAlign: "center",
      color: "#ffffff",
      opacity: 1,
      backgroundColor: "#000000",
      backgroundOpacity: 0.7,
      padding: 12,
      borderRadius: 8,
      maxWidth: 80,
      rotation: 0,
      lineHeight: 1.4,
      shadow: {
        enabled: false,
        color: "#000000",
        blur: 4,
        offsetX: 2,
        offsetY: 2,
      },
    },
  )

  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  const handleChange = useCallback((key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const handleShadowChange = useCallback((key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      shadow: {
        ...prev.shadow,
        [key]: value,
      },
    }))
  }, [])

  const fonts = [
    "Arial", "Georgia", "Times New Roman", "Verdana", 
    "Courier New", "Comic Sans MS", "Impact", "Trebuchet MS",
    "Helvetica", "Tahoma", "Palatino", "Garamond"
  ]

  const getTextStyle = () => {
    const shadow = config.shadow
    const shadowStyle = shadow?.enabled 
      ? `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`
      : "none"

    return {
      fontSize: `${config.fontSize}px`,
      fontFamily: config.fontFamily,
      fontWeight: config.fontWeight,
      fontStyle: config.fontStyle,
      textDecoration: config.textDecoration,
      textAlign: config.textAlign as any,
      color: config.color,
      opacity: config.opacity,
      margin: 0,
      textShadow: shadowStyle,
      transform: `rotate(${config.rotation}deg)`,
      maxWidth: `${config.maxWidth}%`,
      width: 'fit-content',
      wordWrap: 'break-word' as const,
      whiteSpace: 'pre-wrap' as const,
      overflowWrap: 'break-word' as const,
      lineHeight: config.lineHeight,
      display: 'inline-block',
    }
  }

  const getBackgroundStyle = () => {
    return {
      backgroundColor: config.backgroundColor,
      opacity: config.backgroundOpacity,
      padding: `${config.padding}px`,
      borderRadius: `${config.borderRadius}px`,
      display: 'inline-block',
      maxWidth: `${config.maxWidth}%`,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Редактор текста на фото</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setConfig({
              enabled: true,
              text: "Ваш текст здесь",
              x: 50,
              y: 50,
              fontSize: 24,
              fontFamily: "Arial",
              fontWeight: "normal",
              fontStyle: "normal",
              textDecoration: "none",
              textAlign: "center",
              color: "#ffffff",
              opacity: 1,
              backgroundColor: "#000000",
              backgroundOpacity: 0.7,
              padding: 12,
              borderRadius: 8,
              maxWidth: 80,
              rotation: 0,
              lineHeight: 1.4,
              shadow: {
                enabled: false,
                color: "#000000",
                blur: 4,
                offsetX: 2,
                offsetY: 2,
              },
            })
          }}
        >
          Сбросить
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">Предпросмотр текста на фото</label>
          {imageUrl ? (
            <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300" style={{ aspectRatio: "16/9" }}>
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              {config.enabled && (
                <div
                  className="absolute"
                  style={{
                    left: `${config.x}%`,
                    top: `${config.y}%`,
                    transform: "translate(-50%, -50%)",
                    ...getBackgroundStyle(),
                  }}
                >
                  <div style={getTextStyle()}>
                    {config.text}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Type className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>Загрузите изображение для предпросмотра</p>
              </div>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleChange("enabled", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Включить текст на фото</span>
                <p className="text-xs text-gray-500">Отображение текстового overlay на изображении</p>
              </div>
            </label>
          </div>

          {config.enabled && (
            <div className="space-y-6">
              {/* Основной текст */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={config.text}
                  onChange={(e) => handleChange("text", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Введите текст, который будет отображаться на фото..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {config.text?.length || 0}/500 символов • Текст автоматически переносится
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Шрифт</label>
                  <select
                    value={config.fontFamily}
                    onChange={(e) => handleChange("fontFamily", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {fonts.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Размер текста: {config.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={config.fontSize}
                    onChange={(e) => handleChange("fontSize", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Остальной код редактора... */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
