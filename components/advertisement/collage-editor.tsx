"use client"

import { useState, useEffect } from "react"

interface CollageConfig {
  mode?: string
  orientation?: string
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
      orientation: "horizontal",
      skewAngle: 15,
      images: [],
      spacing: 8,
      borderRadius: 12,
      backgroundColor: "#ffffff",
    },
  )

  useEffect(() => {
    onChange(config)
  }, [config, onChange])

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Редактор коллажа</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-700">Предпросмотр коллажа</label>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <p>Предпросмотр коллажа</p>
              <p className="text-sm mt-2">Режим: {config.mode}</p>
              <p className="text-sm">Ориентация: {config.orientation}</p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Режим коллажа</label>
              <select
                value={config.mode}
                onChange={(e) => handleChange("mode", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="2x1">2x1</option>
                <option value="1x2">1x2</option>
                <option value="2x2">2x2</option>
                <option value="3x1">3x1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ориентация</label>
              <select
                value={config.orientation}
                onChange={(e) => handleChange("orientation", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="horizontal">Горизонтальная</option>
                <option value="vertical">Вертикальная</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Угол наклона: {config.skewAngle}°
            </label>
            <input
              type="range"
              min="0"
              max="45"
              value={config.skewAngle}
              onChange={(e) => handleChange("skewAngle", Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Отступ между фото: {config.spacing}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={config.spacing}
              onChange={(e) => handleChange("spacing", Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Скругление углов: {config.borderRadius}px
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
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
