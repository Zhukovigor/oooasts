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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Межстрочный интервал: {config.lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={config.lineHeight}
                    onChange={(e) => handleChange("lineHeight", Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Макс. ширина: {config.maxWidth}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={config.maxWidth}
                    onChange={(e) => handleChange("maxWidth", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Стили текста */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Стиль текста</label>
                <div className="flex gap-2 flex-wrap">
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
                  <Button
                    type="button"
                    variant={config.textDecoration === "underline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleChange("textDecoration", config.textDecoration === "underline" ? "none" : "underline")}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Выравнивание */}
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

              {/* Цвета */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Цвет текста</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.color}
                      onChange={(e) => handleChange("color", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Прозрачность текста: {Math.round((config.opacity || 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.opacity}
                    onChange={(e) => handleChange("opacity", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Фон текста */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Фон текста
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Цвет фона</label>
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Прозрачность фона: {Math.round((config.backgroundOpacity || 0.5) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.backgroundOpacity}
                      onChange={(e) => handleChange("backgroundOpacity", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Отступы: {config.padding}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={config.padding}
                      onChange={(e) => handleChange("padding", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Скругление: {config.borderRadius}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={config.borderRadius}
                      onChange={(e) => handleChange("borderRadius", Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Позиция и тень */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Позиция X: {config.x}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.x}
                    onChange={(e) => handleChange("x", Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Позиция Y: {config.y}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.y}
                    onChange={(e) => handleChange("y", Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Поворот: {config.rotation}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={config.rotation}
                    onChange={(e) => handleChange("rotation", Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Тень текста */}
              <div className="border-t pt-4">
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={config.shadow?.enabled}
                    onChange={(e) => handleShadowChange("enabled", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Включить тень текста</span>
                </label>

                {config.shadow?.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Цвет тени</label>
                      <input
                        type="color"
                        value={config.shadow.color}
                        onChange={(e) => handleShadowChange("color", e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Размытие: {config.shadow.blur}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={config.shadow.blur}
                        onChange={(e) => handleShadowChange("blur", Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Смещение X: {config.shadow.offsetX}px
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={config.shadow.offsetX}
                        onChange={(e) => handleShadowChange("offsetX", Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Смещение Y: {config.shadow.offsetY}px
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={config.shadow.offsetY}
                        onChange={(e) => handleShadowChange("offsetY", Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
