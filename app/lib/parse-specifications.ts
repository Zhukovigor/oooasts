// Обычный парсер для извлечения характеристик из текста
export interface ParsedSpec {
  category: string
  key: string
  value: string
  unit?: string
}

// Категории характеристик на русском
const SPEC_CATEGORIES: Record<string, string[]> = {
  "Двигатель": ["мощность", "объем", "тип топлива", "расход", "rpm", "цилиндры"],
  "Размеры": ["длина", "ширина", "высота", "глубина", "вес", "масса", "размер"],
  "Производительность": ["объем ковша", "грузоподъемность", "выход", "производительность", "часовая", "объем"],
  "Гидравлика": ["давление", "расход", "насос", "давления гидравлического"],
  "Трансмиссия": ["коробка", "передач", "привод", "трансмиссия", "ведущие колеса"],
}

export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  const specs: ParsedSpec[] = []
  const lines = text.split("\n").filter((line) => line.trim())

  // Регулярные выражения для поиска паттернов
  const patterns = [
    /^[\s]*([а-яёА-ЯЁ\s]+?)[\s]*[:\-][\s]*([0-9.,]+[\s]*(?:[а-яё%/()°CKHM²³]+)?)/gm,
    /([а-яёА-ЯЁ\s]+?)[\s]+([0-9.,\s]+(?:[а-яёa-zA-Z%/()°CKHM²³]*)?)/gm,
  ]

  for (const line of lines) {
    if (!line.trim() || line.length < 5) continue

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(line)) !== null) {
        const key = match[1]?.trim()
        const value = match[2]?.trim()

        if (!key || !value || key.length < 2) continue

        // Определяем категорию
        let category = "Прочие"
        for (const [cat, keywords] of Object.entries(SPEC_CATEGORIES)) {
          if (keywords.some((kw) => key.toLowerCase().includes(kw))) {
            category = cat
            break
          }
        }

        specs.push({
          category,
          key: normalizeKey(key),
          value: normalizeValue(value),
        })
      }
    }
  }

  return specs
}

export function convertParsedToJSON(specs: ParsedSpec[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {}

  for (const spec of specs) {
    if (!result[spec.category]) {
      result[spec.category] = {}
    }
    result[spec.category][spec.key] = spec.value
  }

  return result
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .split(/[\s\-_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}
