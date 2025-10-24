export interface ParsedSpecifications {
  "Основные параметры": Record<string, string>
  Двигатель: Record<string, string>
  Гидравлика: Record<string, string>
  Габариты: Record<string, string>
  "Рабочие характеристики": Record<string, string>
  Шасси: Record<string, string>
  "Ходовая часть": Record<string, string>
  Подвеска: Record<string, string>
  "Весовые показатели": Record<string, string>
  "Крановое оборудование": Record<string, string>
  Трансмиссия: Record<string, string>
  Прочее: Record<string, string>
}

export function parseSpecificationsFromText(text: string): ParsedSpecifications {
  const result: ParsedSpecifications = {
    "Основные параметры": {},
    Двигатель: {},
    Гидравлика: {},
    Габариты: {},
    "Рабочие характеристики": {},
    Шасси: {},
    "Ходовая часть": {},
    Подвеска: {},
    "Весовые показатели": {},
    "Крановое оборудование": {},
    Трансмиссия: {},
    Прочее: {},
  }

  // Маппинг заголовков секций на категории
  const sectionMapping: Record<string, keyof ParsedSpecifications> = {
    "габаритные параметры": "Габариты",
    габариты: "Габариты",
    двигатель: "Двигатель",
    шасси: "Шасси",
    "ходовая часть": "Ходовая часть",
    подвеска: "Подвеска",
    "весовые показатели": "Весовые показатели",
    "рабочие параметры": "Рабочие характеристики",
    "рабочие характеристики": "Рабочие характеристики",
    "крановое оборудование": "Крановое оборудование",
    "гидравлическая система": "Гидравлика",
    гидравлика: "Гидравлика",
    трансмиссия: "Трансмиссия",
    "дополнительные характеристики": "Прочее",
  }

  // Разбиваем текст на строки
  const lines = text.split("\n").map((line) => line.trim())

  let currentCategory: keyof ParsedSpecifications = "Прочее"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Проверяем, является ли строка заголовком секции
    const lowerLine = line.toLowerCase()
    let foundSection = false

    for (const [sectionName, category] of Object.entries(sectionMapping)) {
      if (lowerLine === sectionName || lowerLine.startsWith(sectionName)) {
        currentCategory = category
        foundSection = true
        break
      }
    }

    if (foundSection) continue

    // Пропускаем строку "Описание" и "О товаре"
    if (lowerLine === "описание" || lowerLine === "о товаре") continue

    // Извлекаем пары ключ-значение
    // Поддерживаем форматы: "Ключ: значение", "Ключ - значение", "Ключ：значение"
    const colonMatch = line.match(/^([^:：-]+?)[\s]*[:：-][\s]*(.+)$/)

    if (colonMatch) {
      const key = colonMatch[1].trim()
      const value = colonMatch[2].trim()

      // Пропускаем пустые значения
      if (key && value) {
        result[currentCategory][key] = value
      }
    }
  }

  // Дополнительно извлекаем основные параметры из первой строки описания
  const firstLine = lines[0]
  if (firstLine && !firstLine.toLowerCase().includes("описание")) {
    // Извлекаем модель из первой строки
    const modelMatch = firstLine.match(/^([^,]+)/i)
    if (modelMatch && !result["Основные параметры"]["Модель"]) {
      result["Основные параметры"]["Модель"] = modelMatch[1].trim()
    }
  }

  return result
}

export function convertParsedToJSON(parsed: ParsedSpecifications): Record<string, any> {
  const json: Record<string, any> = {}

  Object.entries(parsed).forEach(([category, specs]) => {
    if (Object.keys(specs).length > 0) {
      json[category] = specs
    }
  })

  return json
}
