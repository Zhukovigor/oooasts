// Обычный парсер для извлечения характеристик из текста
export interface ParsedSpec {
  category: string
  key: string
  value: string
  unit?: string
}

const SPEC_CATEGORIES: Record<string, string[]> = {
  "Двигатель": ["мощность", "кВт", "л.с.", "объем двигателя", "тип топлива", "расход топлива", "rpm", "об/мин", "цилиндры", "турбо"],
  "Размеры и вес": ["длина", "ширина", "высота", "глубина", "вес", "масса", "размер", "габариты", "рабочий вес", "вес конструкции"],
  "Производительность": ["объем ковша", "грузоподъемность", "выход", "производительность", "часовая производительность", "объем", "минут"],
  "Гидравлика": ["давление", "расход гидравлический", "насос", "максимальное давление", "система"],
  "Трансмиссия": ["коробка", "передач", "привод", "трансмиссия", "ведущие колеса", "скорость"],
  "Копание": ["максимальная глубина", "глубина копания", "высота разгрузки", "радиус действия"],
}

export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  const specs: ParsedSpec[] = []
  const lines = text.split("\n").filter((line) => line.trim())

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 5) continue

    const match = trimmed.match(/^([^:\-—]+?)[\s]*[:—\-][\s]*([^:\-—]+?)(?:\s*[\-–].*)?$/)
    
    if (!match) continue

    const rawKey = match[1]?.trim()
    const rawValue = match[2]?.trim()

    if (!rawKey || !rawValue || rawKey.length < 2 || rawValue.length < 1) continue

    if (rawValue.length > 200) continue

    let category = "Прочие характеристики"
    const keyLower = rawKey.toLowerCase()
    
    for (const [cat, keywords] of Object.entries(SPEC_CATEGORIES)) {
      if (keywords.some((kw) => keyLower.includes(kw.toLowerCase()))) {
        category = cat
        break
      }
    }

    const normalizedKey = normalizeKey(rawKey)
    const normalizedValue = normalizeValue(rawValue)

    const isDuplicate = specs.some(
      (s) => s.category === category && s.key === normalizedKey
    )
    if (isDuplicate) continue

    specs.push({
      category,
      key: normalizedKey,
      value: normalizedValue,
    })
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
    .replace(/\s+/g, " ")
    .split(/[\s\-_]+/)
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      return word.toLowerCase()
    })
    .join(" ")
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/<[^>]*>/g, "") // убираем HTML теги
    .replace(/\s+/g, " ") // нормализуем пробелы
    .replace(/([0-9]+),([0-9]{2,3})\s*(кВт|л\.с\.|т|м³|мм|м|кг)/gi, "$1.$2 $3") // нормализуем числа
    .substring(0, 100) // Ограничиваем длину значения
}
