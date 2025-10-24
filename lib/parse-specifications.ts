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

  const sectionMapping: Record<string, keyof ParsedSpecifications> = {
    "габаритные параметры": "Габариты",
    "габаритные размеры": "Габариты",
    габариты: "Габариты",
    размеры: "Габариты",
    двигатель: "Двигатель",
    мотор: "Двигатель",
    шасси: "Шасси",
    "ходовая часть": "Ходовая часть",
    ходовая: "Ходовая часть",
    подвеска: "Подвеска",
    "весовые показатели": "Весовые показатели",
    "весовые параметры": "Весовые показатели",
    вес: "Весовые показатели",
    "рабочие параметры": "Рабочие характеристики",
    "рабочие характеристики": "Рабочие характеристики",
    "технические характеристики": "Рабочие характеристики",
    "крановое оборудование": "Крановое оборудование",
    "кран-манипулятор": "Крановое оборудование",
    кран: "Крановое оборудование",
    "гидравлическая система": "Гидравлика",
    гидравлика: "Гидравлика",
    гидросистема: "Гидравлика",
    трансмиссия: "Трансмиссия",
    коробка: "Трансмиссия",
    "дополнительные характеристики": "Прочее",
    дополнительно: "Прочее",
    прочее: "Прочее",
  }

  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/\s+/g, " ")

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  let currentCategory: keyof ParsedSpecifications = "Прочее"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const lowerLine = line.toLowerCase().trim()
    let foundSection = false

    for (const [sectionName, category] of Object.entries(sectionMapping)) {
      if (
        lowerLine === sectionName ||
        lowerLine.startsWith(sectionName + ":") ||
        lowerLine.startsWith(sectionName + " ") ||
        lowerLine === sectionName + ":" ||
        lowerLine.endsWith(sectionName)
      ) {
        currentCategory = category
        foundSection = true
        break
      }
    }

    if (foundSection) continue

    if (lowerLine === "описание" || lowerLine === "о товаре" || lowerLine === "характеристики" || lowerLine.length < 3)
      continue

    // Supports: "Key: value", "Key - value", "Key：value", "Key  value" (multiple spaces)
    const patterns = [
      /^([^:：\-—]+?)[\s]*[:：][\s]*(.+)$/, // Colon separator
      /^([^:：\-—]+?)[\s]*[-—][\s]*(.+)$/, // Dash separator
      /^([^:：\-—]+?)[\s]{2,}(.+)$/, // Multiple spaces separator
    ]

    let matched = false
    for (const pattern of patterns) {
      const match = line.match(pattern)
      if (match) {
        let key = match[1].trim()
        let value = match[2].trim()

        key = key.replace(/[•·\-—]/g, "").trim()
        value = value.replace(/^[•·\-—\s]+/, "").trim()

        if (key.length > 1 && value.length > 0) {
          result[currentCategory][key] = value
          matched = true
          break
        }
      }
    }

    if (!matched && line.includes(" ") && !line.endsWith(":")) {
      // Try to split on first occurrence of multiple spaces or common separators
      const parts = line.split(/\s{2,}|(?<=\D)\s+(?=\d)/)
      if (parts.length >= 2) {
        const key = parts[0]
          .trim()
          .replace(/[•·\-—]/g, "")
          .trim()
        const value = parts.slice(1).join(" ").trim()
        if (key.length > 1 && value.length > 0) {
          result[currentCategory][key] = value
        }
      }
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
