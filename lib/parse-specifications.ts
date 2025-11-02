import type { ParsedSpecifications } from "./types" // Assuming ParsedSpecifications is declared in a separate file

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
    "основные параметры": "Основные параметры",
    основные: "Основные параметры",
  }

  // Предварительная обработка текста
  let processedText = text.replace(/\r\n/g, " ").replace(/\n/g, " ").replace(/\t/g, " ").replace(/\s+/g, " ").trim()

  // Удаляем лишние заголовки
  processedText = processedText
    .replace(/^Извлеченные характеристики:\s*/i, "")
    .replace(/Применить к форме$/i, "")
    .trim()

  // Сначала исправляем порядок единиц измерения во всем тексте
  processedText = fixUnitOrderInText(processedText)

  // Разбиваем на предложения, сохраняя структуру
  const sentences = processedText.split(/(?<=[.\d])\s+(?=[А-ЯA-Z])/)

  let currentCategory: keyof ParsedSpecifications = "Прочее"

  for (const sentence of sentences) {
    if (!sentence.trim()) continue

    const cleanSentence = sentence.trim()
    const lowerSentence = cleanSentence.toLowerCase()

    // Определяем категорию по ключевым словам
    if (
      lowerSentence.includes("двигатель") ||
      lowerSentence.includes("мощность") ||
      (lowerSentence.includes("объем") && lowerSentence.includes("л"))
    ) {
      currentCategory = "Двигатель"
    } else if (
      lowerSentence.includes("шасси") ||
      lowerSentence.includes("модель") ||
      lowerSentence.includes("максимальная скорость")
    ) {
      currentCategory = "Шасси"
    } else if (lowerSentence.includes("ходовая") || lowerSentence.includes("колесн") || lowerSentence.includes("шин")) {
      currentCategory = "Ходовая часть"
    } else if (lowerSentence.includes("подвеск") || lowerSentence.includes("рессор")) {
      currentCategory = "Подвеска"
    } else if (lowerSentence.includes("масс") || lowerSentence.includes("нагруз") || lowerSentence.includes("кг")) {
      currentCategory = "Весовые показатели"
    } else if (
      lowerSentence.includes("кран") ||
      lowerSentence.includes("стрел") ||
      lowerSentence.includes("грузоподъемност")
    ) {
      currentCategory = "Крановое оборудование"
    } else if (
      lowerSentence.includes("гидравлич") ||
      lowerSentence.includes("гидробак") ||
      lowerSentence.includes("мпа")
    ) {
      currentCategory = "Гидравлика"
    } else if (lowerSentence.includes("трансмисс") || lowerSentence.includes("привод")) {
      currentCategory = "Трансмиссия"
    } else if (
      lowerSentence.includes("габарит") ||
      lowerSentence.includes("размер") ||
      lowerSentence.includes("мм") ||
      lowerSentence.includes("высот") ||
      lowerSentence.includes("ширин") ||
      lowerSentence.includes("длин")
    ) {
      currentCategory = "Габариты"
    }

    parseComplexSentence(cleanSentence, currentCategory, result)
  }

  return result
}

function parseComplexSentence(
  sentence: string,
  category: keyof ParsedSpecifications,
  result: ParsedSpecifications,
): void {
  // Improved patterns for different text formats with better separation
  const patterns = [
    // "Ключ: значение" format
    /([^:;=\-*]+?):\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
    // "Ключ = значение" format
    /([^:;=\-*]+?)\s*=\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
    // "Ключ - значение" format
    /([^:;=\-*]+?)\s*-\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
    // "Ключ; значение" format
    /([^:;=\-*]+?);\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
    // "* ключ = значение" format
    /\*\s*([^:;=\-*]+?)\s*[=\-:]\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
    // "- ключ = значение" format
    /-\s*([^:;=\-*]+?)\s*[=\-:]\s*([^:;=\-*]+?)(?=[;=\-*]|$)/g,
  ]

  for (const pattern of patterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(sentence)) !== null) {
      if (match[1] && match[2]) {
        let key = match[1].trim()
        let value = match[2].trim()

        // Clean key from units and brackets
        key = key
          .replace(/^\s*[[$$]*\s*/, "")
          .replace(/\s*[\]$$]*\s*$/, "")
          .trim()
        key = key.replace(/^(мм|см|м|км|кг|т|л|кВт|л\.с\.|об\/мин|°|МПа)\s+/, "").trim()
        key = key.replace(/[•·\-—\d]/g, "").trim()

        // Skip short keys or numeric-only values
        if (key.length < 2 || /^\d+$/.test(key)) continue

        // Clean value from brackets
        value = value
          .replace(/^\s*[[$$]*\s*/, "")
          .replace(/\s*[\]$$]*\s*$/, "")
          .trim()
        value = value.replace(/^[•·\-—\s,;:]+/, "").trim()
        value = fixValueUnitOrder(value)
        value = addMissingUnits(key, value)

        if (value && !value.endsWith(":") && value.length > 0) {
          result[category][key] = value
        }
      }
    }
  }

  const sizePatterns = [
    /(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*(м|см|мм)?/,
    /(\d+(?:[.,]\d+)?)\s*(м|см|мм)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*(м|см|мм)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*(м|см|мм)/,
  ]

  for (const pattern of sizePatterns) {
    const sizeMatch = sentence.match(pattern)
    if (sizeMatch) {
      const unit = sizeMatch[4] || sizeMatch[2] || "мм"
      result[category]["Размеры"] = `${sizeMatch[1]} × ${sizeMatch[3]} × ${sizeMatch[5] || sizeMatch[4]} ${unit}`
      break
    }
  }

  const nestedPatterns = [/([А-Яа-яA-Za-z\s]+?):\s*\*?([А-Яа-яA-Za-z]+?)\s*[=\-:]\s*([^;]*?)(?=[;,]|$)/gi]

  for (const pattern of nestedPatterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(sentence)) !== null) {
      if (match[2] && match[3]) {
        const key = match[2].trim()
        let value = match[3].trim()
        value = value.replace(/^[•·\-—\s,;:]+/, "").trim()
        value = fixValueUnitOrder(value)
        value = addMissingUnits(key, value)

        if (value && value.length > 0) {
          result[category][key] = value
        }
      }
    }
  }
}

// Функция для автоматического добавления единиц измерения
function addMissingUnits(key: string, value: string): string {
  // Если значение уже содержит единицы измерения, возвращаем как есть
  if (/(мм|см|м|км|кг|т|л|кВт|л\.с\.|об\/мин|°|МПа)/i.test(value)) {
    return value
  }

  // Если значение - просто число, добавляем соответствующую единицу измерения
  const numericMatch = value.match(/^(\d+(?:[.,]\d+)?)$/)
  if (numericMatch) {
    const numericValue = numericMatch[1]
    const lowerKey = key.toLowerCase()

    // Определяем единицу измерения по контексту ключа
    if (
      lowerKey.includes("длина") ||
      lowerKey.includes("ширина") ||
      lowerKey.includes("высота") ||
      lowerKey.includes("база") ||
      lowerKey.includes("колея") ||
      lowerKey.includes("габарит")
    ) {
      return `${numericValue} мм`
    } else if (lowerKey.includes("масса") || lowerKey.includes("вес") || lowerKey.includes("нагрузка")) {
      return `${numericValue} кг`
    } else if (lowerKey.includes("объем") || lowerKey.includes("вместимость")) {
      return `${numericValue} л`
    } else if (lowerKey.includes("мощность") && !lowerKey.includes("л.с.")) {
      return `${numericValue} кВт`
    } else if (lowerKey.includes("скорость")) {
      return `${numericValue} км/ч`
    } else if (lowerKey.includes("давление")) {
      return `${numericValue} МПа`
    } else if (lowerKey.includes("диапазон") || lowerKey.includes("радиус") || lowerKey.includes("вылет")) {
      return `${numericValue} мм`
    } else if (lowerKey.includes("подъем") && lowerKey.includes("высота")) {
      return `${numericValue} мм`
    }
  }

  return value
}

// Функция для исправления порядка единиц измерения в тексте
function fixUnitOrderInText(text: string): string {
  let fixedText = text

  // Исправляем порядок "единица Ключ: значение" на "Ключ: значение единица"
  const unitPatterns = [
    { pattern: /(\bмм\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bсм\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bм\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bкм\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bкг\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bт\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bл\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bкВт\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bл\.с\.\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bоб\/мин\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\b°\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
    { pattern: /(\bМПа\b)\s+([А-Яа-яA-Za-z]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g, replacement: "$2: $3 $1" },
  ]

  for (const unitPattern of unitPatterns) {
    fixedText = fixedText.replace(unitPattern.pattern, unitPattern.replacement)
  }

  return fixedText
}

// Дополнительная функция для исправления порядка единиц в значениях
function fixValueUnitOrder(value: string): string {
  const unitValuePatterns = [
    /^(мм|см|м|км|кг|т|л|кВт|л\.с\.|об\/мин|°|МПа)\s+(\d+(?:[.,]\d+)?)$/,
    /^(мм|см|м|км|кг|т|л|кВт|л\.с\.|об\/мин|°|МПа)\s+(\d+(?:[.,]\d+)?\s*[×x*]\s*\d+(?:[.,]\d+)?\s*[×x*]\s*\d+(?:[.,]\d+)?)$/,
  ]

  for (const pattern of unitValuePatterns) {
    const match = value.match(pattern)
    if (match) {
      return `${match[2]} ${match[1]}`
    }
  }

  return value
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
