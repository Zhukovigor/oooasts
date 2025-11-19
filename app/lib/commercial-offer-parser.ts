// Parser for extracting commercial offer data from text

export interface CommercialOfferData {
  title?: string;
  equipment?: string;
  model?: string;
  price?: number;
  priceWithVat?: boolean;
  availability?: string;
  paymentType?: string;
  lease?: boolean;
  vatIncluded?: boolean;
  diagnosticsPassed?: boolean;
  specifications?: Record<string, string>;
}

// Расширенные ключевые слова для лучшего распознавания
const categoryKeywords = {
  engine: ['двигатель', 'мощность', 'топливо', 'евро', 'объем', 'л.с.', 'крутящий'],
  basic: ['модель', 'марка', 'год', 'пробег', 'тип', 'состояние', 'vin'],
  chassis: ['колесная', 'подвеска', 'тормоза', 'кпп', 'коробка', 'трансмиссия', 'мост'],
  cabin: ['кабина', 'цвет', 'место', 'спальное', 'кондиционер', 'круиз', 'обогрев'],
  dimensions: ['габариты', 'длина', 'ширина', 'высота', 'масса', 'грузоподъемность']
}

// Улучшенные регулярные выражения
const patterns = {
  price: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+)\s*руб/i,
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке)/i,
  lease: /(?:лизинг|аренда|рассрочк)/i,
  paymentType: /(?:безналичн|нал\s*\/\s*безнал|перевод|карт)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр)/i,
  year: /(?:год|г\.в\.|выпуск)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+)\s*(?:км|km)/i,
  model: /(?:модель)[^:]*:?\s*([^\n,|]+)/i,
  brand: /(?:марка)[^:]*:?\s*([^\n,|]+)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран)/i
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  }

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== 'я')

  // Извлечение основных данных
  extractBasicInfo(data, lines, normalizedText)
  
  // Извлечение цены и условий
  extractPricingInfo(data, normalizedText)
  
  // Извлечение характеристик
  extractSpecifications(data, text)

  return data
}

function extractBasicInfo(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск оборудования/типа техники
  const equipmentMatch = normalizedText.match(patterns.equipment)
  if (equipmentMatch) {
    data.equipment = equipmentMatch[0]
  }

  // Поиск в первых строках для названия
  const firstLines = lines.slice(0, 3)
  
  // Популярные бренды для поиска
  const brands = [
    'volvo', 'komatsu', 'cat', 'caterpillar', 'scania', 'man', 'daf', 'renault', 
    'iveco', 'mercedes', 'benz', 'bmw', 'audi', 'toyota', 'nissan', 'mitsubishi'
  ]

  // Поиск бренда и модели в первых строках
  for (const line of firstLines) {
    const lowerLine = line.toLowerCase()
    
    // Проверяем на наличие брендов
    for (const brand of brands) {
      if (lowerLine.includes(brand)) {
        data.title = line.trim()
        
        // Пытаемся извлечь модель
        const modelParts = line.split(/\s+/)
        const brandIndex = modelParts.findIndex(part => part.toLowerCase().includes(brand))
        if (brandIndex !== -1 && brandIndex + 1 < modelParts.length) {
          data.model = modelParts[brandIndex + 1]
        }
        break
      }
    }
    
    if (data.title) break
  }

  // Если не нашли бренд, используем первую строку как заголовок
  if (!data.title && lines.length > 0) {
    data.title = lines[0].trim()
  }

  // Если есть оборудование но нет в заголовке, добавляем
  if (data.equipment && data.title && !data.title.toLowerCase().includes(data.equipment.toLowerCase())) {
    data.title = `${data.equipment} ${data.title}`
  }
}

function extractPricingInfo(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены
  const priceMatch = normalizedText.match(patterns.price)
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/\s/g, '')
    if (priceStr && priceStr !== '1') { // Игнорируем явно ошибочную цену 1 рубль
      data.price = parseInt(priceStr)
    }
  }

  // Альтернативные форматы цены
  if (!data.price) {
    const altPriceMatch = normalizedText.match(/([\d\s]+)\s*руб/i)
    if (altPriceMatch && !normalizedText.includes('пробег')) {
      const priceStr = altPriceMatch[1].replace(/\s/g, '')
      if (priceStr && priceStr !== '1') {
        data.price = parseInt(priceStr)
      }
    }
  }

  // Условия покупки
  if (patterns.priceWithVat.test(normalizedText)) {
    data.priceWithVat = true
    data.vatIncluded = true
  }
  
  if (patterns.availability.test(normalizedText)) {
    data.availability = 'В наличии'
  }
  
  if (patterns.lease.test(normalizedText)) {
    data.lease = true
  }
  
  if (patterns.paymentType.test(normalizedText)) {
    data.paymentType = 'Безналичная оплата с НДС'
  }
  
  if (patterns.diagnostics.test(normalizedText)) {
    data.diagnosticsPassed = true
  }
}

function extractSpecifications(data: CommercialOfferData, text: string) {
  const specs: Record<string, string> = {}
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== 'я')
  
  // Сначала извлекаем табличные данные
  extractTableData(specs, lines)
  
  // Затем обычные ключ-значения
  extractKeyValueFromText(specs, lines)
  
  // И через регулярки
  extractWithRegex(specs, text)
  
  data.specifications = specs
}

function extractTableData(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Обработка строк таблицы вида "Марка | VOLVO"
    if (line.includes('|')) {
      const tableParts = line.split('|').map(part => part.trim()).filter(part => part)
      if (tableParts.length >= 2) {
        const key = tableParts[0]
        const value = tableParts[1]
        if (isValidKey(key) && isValidValue(value) && !specs[key]) {
          specs[key] = value
        }
        
        // Обработка пар в одной строке таблицы
        if (tableParts.length >= 4) {
          for (let j = 0; j < tableParts.length; j += 2) {
            if (j + 1 < tableParts.length) {
              const tableKey = tableParts[j]
              const tableValue = tableParts[j + 1]
              if (isValidKey(tableKey) && isValidValue(tableValue) && !specs[tableKey]) {
                specs[tableKey] = tableValue
              }
            }
          }
        }
      }
    }
  }
}

function extractKeyValueFromText(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const keyValue = extractKeyValue(lines, i)
    if (keyValue && !specs[keyValue.key]) {
      specs[keyValue.key] = keyValue.value
      i = keyValue.nextIndex
    }
  }
}

function extractKeyValue(lines: string[], startIndex: number): { key: string; value: string; nextIndex: number } | null {
  if (startIndex >= lines.length) return null
  
  const line = lines[startIndex]
  
  // Сначала пробуем из одной строки
  const singleLineMatch = extractFromSingleLine(line)
  if (singleLineMatch) {
    return {
      key: singleLineMatch.key,
      value: singleLineMatch.value,
      nextIndex: startIndex
    }
  }
  
  // Затем из двух строк
  if (startIndex < lines.length - 1) {
    const key = line
    const value = lines[startIndex + 1]
    
    if (isValidKey(key) && isValidValue(value)) {
      return {
        key: key.trim(),
        value: value.trim(),
        nextIndex: startIndex + 1
      }
    }
  }
  
  return null
}

function extractFromSingleLine(line: string): { key: string; value: string } | null {
  const separators = [':', '|', ' - ', ' — ', ' • ', '   ']
  
  for (const separator of separators) {
    const parts = line.split(separator).map(part => part.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const key = parts[0]
      const value = parts.slice(1).join(separator).trim()
      
      if (isValidKey(key) && isValidValue(value)) {
        return { key, value }
      }
    }
  }
  
  return null
}

function extractWithRegex(specs: Record<string, string>, text: string) {
  const normalizedText = text.toLowerCase()
  
  // Извлечение года
  const yearMatch = normalizedText.match(patterns.year)
  if (yearMatch && !specs['Год выпуска']) {
    specs['Год выпуска'] = yearMatch[1]
  }
  
  // Извлечение пробега
  const mileageMatch = normalizedText.match(patterns.mileage)
  if (mileageMatch && !specs['Пробег']) {
    specs['Пробег'] = mileageMatch[1].replace(/\s/g, '') + ' км'
  }
  
  // Извлечение модели
  const modelMatch = normalizedText.match(patterns.model)
  if (modelMatch && !specs['Модель']) {
    specs['Модель'] = modelMatch[1].trim()
  }
  
  // Извлечение марки
  const brandMatch = normalizedText.match(patterns.brand)
  if (brandMatch && !specs['Марка']) {
    specs['Марка'] = brandMatch[1].trim()
  }
  
  // Дополнительные характеристики из текста
  const additionalSpecs = [
    { pattern: /двигатель\s*([^,\n]+)/i, key: 'Двигатель' },
    { pattern: /мощность\s*([^,\n]+)/i, key: 'Мощность двигателя' },
    { pattern: /подвеск[аи]\s*([^,\n]+)/i, key: 'Тип подвески' },
    { pattern: /тормоз[аы]\s*([^,\n]+)/i, key: 'Тормоза' },
    { pattern: /кабин[аы]\s*([^,\n]+)/i, key: 'Тип кабины' },
    { pattern: /цвет\s*([^,\n]+)/i, key: 'Цвет кузова' },
    { pattern: /топлив[оа]\s*([^,\n]+)/i, key: 'Вид топлива' },
    { pattern: /колесная\s*формула\s*([^,\n]+)/i, key: 'Колесная формула' }
  ]
  
  for (const spec of additionalSpecs) {
    const match = normalizedText.match(spec.pattern)
    if (match && !specs[spec.key]) {
      specs[spec.key] = match[1].trim()
    }
  }
}

function isValidKey(key: string): boolean {
  if (!key || key.length < 1 || key.length > 100) return false
  if (key.match(/^\d+$/)) return false
  if (!key.match(/[а-яёa-z]/i)) return false
  if (key.toLowerCase().includes('коммерческое')) return false
  if (key.toLowerCase().includes('стоимость')) return false
  if (key.toLowerCase().includes('руб')) return false
  if (key === 'я') return false
  
  return true
}

function isValidValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 150) return false
  if (value.toLowerCase().includes('характеристики')) return false
  if (value.toLowerCase().includes('техники')) return false
  if (value === 'я') return false
  
  return true
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([a], [b]) => {
      const getCategory = (key: string) => {
        const lowerKey = key.toLowerCase()
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => lowerKey.includes(kw))) {
            return category
          }
        }
        return 'other'
      }
      
      const categoryOrder = ['basic', 'engine', 'chassis', 'cabin', 'dimensions', 'other']
      const catA = categoryOrder.indexOf(getCategory(a))
      const catB = categoryOrder.indexOf(getCategory(b))
      return catA - catB
    })
  
  const rows: Array<Array<[string, string]>> = []
  
  for (let i = 0; i < entries.length; i += 2) {
    const row: Array<[string, string]> = []
    row.push(entries[i])
    if (i + 1 < entries.length) {
      row.push(entries[i + 1])
    }
    rows.push(row)
  }
  
  return rows
}
