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
  model: /(?:модель)[^:]*:?\s*([^\n,]+)/i,
  brand: /(?:марка)[^:]*:?\s*([^\n,]+)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран)/i
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  }

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim()
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)

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
    data.price = parseInt(priceMatch[1].replace(/\s/g, ''))
  }

  // Альтернативные форматы цены
  if (!data.price) {
    const altPriceMatch = normalizedText.match(/([\d\s]+)\s*руб/i)
    if (altPriceMatch && !normalizedText.includes('пробег')) {
      data.price = parseInt(altPriceMatch[1].replace(/\s/g, ''))
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
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  
  // Флаги для определения секций
  let inSpecsSection = false
  let foundSpecsHeader = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()
    
    // Пропускаем заголовки и ценовые блоки
    if (lowerLine.includes('коммерческое') || 
        lowerLine.includes('стоимость') || 
        lowerLine.includes('руб.') ||
        line.length > 100) {
      continue
    }
    
    // Ищем начало секции характеристик
    if (!foundSpecsHeader && (lowerLine.includes('характеристики') || lowerLine.includes('технические'))) {
      inSpecsSection = true
      foundSpecsHeader = true
      continue
    }
    
    // Если мы в секции характеристик или находим пары ключ-значение
    if (inSpecsSection || isPotentialKeyValue(lines, i)) {
      const keyValue = extractKeyValue(lines, i)
      if (keyValue) {
        specs[keyValue.key] = keyValue.value
        i = keyValue.nextIndex
      }
    }
  }
  
  // Если не нашли секцию, анализируем весь текст на пары ключ-значение
  if (Object.keys(specs).length === 0) {
    extractKeyValueFromText(specs, lines)
  }
  
  // Дополнительно извлекаем данные через регулярные выражения
  extractWithRegex(specs, text)
  
  data.specifications = specs
}

function isPotentialKeyValue(lines: string[], index: number): boolean {
  if (index >= lines.length - 1) return false
  
  const current = lines[index]
  const next = lines[index + 1]
  
  // Текущая строка похожа на ключ
  const isKey = current && 
    current.length < 50 && 
    !current.match(/^\d+$/) && 
    current.match(/[а-яёa-z]/i) &&
    !current.toLowerCase().includes('коммерческое') &&
    !current.toLowerCase().includes('стоимость')
  
  // Следующая строка похожа на значение
  const isValue = next && 
    next.length < 100 && 
    !next.toLowerCase().includes('характеристики') &&
    !next.toLowerCase().includes('техники')
  
  return isKey && isValue
}

function extractKeyValue(lines: string[], startIndex: number): { key: string; value: string; nextIndex: number } | null {
  if (startIndex >= lines.length - 1) return null
  
  const key = lines[startIndex]
  const value = lines[startIndex + 1]
  
  if (isValidKey(key) && isValidValue(value)) {
    return {
      key: key.trim(),
      value: value.trim(),
      nextIndex: startIndex + 1
    }
  }
  
  // Пробуем извлечь из одной строки с разделителем
  const singleLineMatch = extractFromSingleLine(lines[startIndex])
  if (singleLineMatch) {
    return {
      key: singleLineMatch.key,
      value: singleLineMatch.value,
      nextIndex: startIndex
    }
  }
  
  return null
}

function extractFromSingleLine(line: string): { key: string; value: string } | null {
  // Разделители для пар ключ-значение в одной строке
  const separators = [':', '：', ' - ', ' — ', ' • ']
  
  for (const separator of separators) {
    const parts = line.split(separator)
    if (parts.length >= 2) {
      const key = parts[0].trim()
      const value = parts.slice(1).join(separator).trim()
      
      if (isValidKey(key) && isValidValue(value)) {
        return { key, value }
      }
    }
  }
  
  return null
}

function extractKeyValueFromText(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const keyValue = extractKeyValue(lines, i) || 
                    (extractFromSingleLine(lines[i]) ? { 
                      key: extractFromSingleLine(lines[i])!.key, 
                      value: extractFromSingleLine(lines[i])!.value,
                      nextIndex: i 
                    } : null)
    
    if (keyValue && !specs[keyValue.key]) {
      specs[keyValue.key] = keyValue.value
      i = keyValue.nextIndex
    }
  }
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
}

function isValidKey(key: string): boolean {
  return key && 
    key.length < 50 && 
    !key.match(/^\d+$/) && 
    key.match(/[а-яёa-z]/i) &&
    !key.toLowerCase().includes('коммерческое') &&
    !key.toLowerCase().includes('стоимость') &&
    !key.toLowerCase().includes('руб')
}

function isValidValue(value: string): boolean {
  return value && 
    value.length < 100 && 
    !value.toLowerCase().includes('характеристики') &&
    !value.toLowerCase().includes('техники') &&
    !value.toLowerCase().includes('коммерческое')
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([a], [b]) => {
      // Сортируем по категориям для лучшего отображения
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
