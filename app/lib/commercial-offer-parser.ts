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

// Ключевые слова для категорий характеристик
const categoryKeywords = {
  engine: ['двигатель', 'мощность', 'топливо', 'евро', 'объем', 'цилиндр'],
  basic: ['модель', 'марка', 'год', 'пробег', 'тип', 'состояние'],
  chassis: ['колеснаяформула', 'подвеска', 'тормоза', 'кпп', 'коробка', 'трансмиссия'],
  cabin: ['кабина', 'цвет', 'место', 'спальное', 'кондиционер'],
  dimensions: ['габариты', 'длина', 'ширина', 'высота', 'масса', 'грузоподъемность']
}

// Регулярные выражения для извлечения данных
const patterns = {
  price: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+)\s*руб/i,
  priceWithVat: /с\s*ндс|ндс\s*включен|цена\s*с\s*ндс/i,
  availability: /в\s*наличии|доступн|готов\s*к\s*отгрузке/i,
  lease: /лизинг|аренда|рассрочк/i,
  paymentType: /безналичн|нал\s*/\s*безнал|перевод|карт/i,
  diagnostics: /диагностика\s*пройдена|проверен|тех\s*осмотр/i,
  year: /(?:год|г\.в\.|выпуск)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+)\s*(?:км|km)/i,
  model: /(?:модель)[^:]*:?\s*([^\n,]+)/i,
  brand: /(?:марка)[^:]*:?\s*([^\n,]+)/i
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  }

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim()
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)

  // Извлечение названия и типа техники
  extractTitleAndEquipment(data, lines, normalizedText)
  
  // Извлечение цены и условий
  extractPricingAndConditions(data, normalizedText)
  
  // Извлечение характеристик
  extractSpecifications(data, lines, normalizedText)

  return data
}

function extractTitleAndEquipment(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск в первых строках
  const firstLines = lines.slice(0, 3)
  
  // Поиск брендов и моделей
  const brands = ['volvo', 'komatsu', 'cat', 'caterpillar', 'scania', 'man', 'daf', 'renault']
  const equipmentTypes = ['тягач', 'экскаватор', 'погрузчик', 'бетонораспределитель', 'самосвал', 'кран']
  
  // Извлечение типа техники
  for (const line of firstLines) {
    const lowerLine = line.toLowerCase()
    
    // Поиск типа техники
    for (const type of equipmentTypes) {
      if (lowerLine.includes(type)) {
        data.equipment = line.trim()
        break
      }
    }
    
    // Поиск бренда и модели
    for (const brand of brands) {
      if (lowerLine.includes(brand)) {
        data.title = line.trim()
        
        // Извлечение модели
        const modelMatch = line.match(new RegExp(`${brand}\\s+([^\\s,]+)`, 'i'))
        if (modelMatch) {
          data.model = modelMatch[1]
        }
        break
      }
    }
    
    if (data.title && data.equipment) break
  }

  // Если не нашли в первых строках, используем первую строку как заголовок
  if (!data.title && lines.length > 0) {
    data.title = lines[0].trim()
  }
}

function extractPricingAndConditions(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены
  const priceMatch = normalizedText.match(patterns.price)
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/\s/g, ''))
  }

  // Извлечение условий
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

function extractSpecifications(data: CommercialOfferData, lines: string[], normalizedText: string) {
  const specs: Record<string, string> = {}
  
  // Поиск секции с характеристиками
  let inSpecsSection = false
  const specStartKeywords = ['характеристики', 'технические', 'параметры', 'specifications']
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const lowerLine = line.toLowerCase()
    
    // Проверяем начало секции характеристик
    if (!inSpecsSection) {
      if (specStartKeywords.some(keyword => lowerLine.includes(keyword))) {
        inSpecsSection = true
        continue
      }
    }
    
    if (inSpecsSection) {
      // Пропускаем пустые строки и заголовки
      if (!line || line.length > 100 || lowerLine.includes('коммерческое') || lowerLine.includes('стоимость')) {
        continue
      }
      
      // Пытаемся извлечь пары ключ-значение
      const keyValueMatch = extractKeyValuePair(line, lines[i + 1])
      if (keyValueMatch) {
        specs[keyValueMatch.key] = keyValueMatch.value
        i++ // Пропускаем следующую строку, так как она использована как значение
      } else {
        // Пытаемся извлечь из одной строки
        const singleLineMatch = extractFromSingleLine(line)
        if (singleLineMatch) {
          specs[singleLineMatch.key] = singleLineMatch.value
        }
      }
    }
  }
  
  // Если не нашли секцию характеристик, анализируем весь текст
  if (Object.keys(specs).length === 0) {
    extractSpecsFromFullText(specs, lines)
  }
  
  // Извлечение специфических данных через регулярные выражения
  extractWithPatterns(specs, normalizedText)
  
  data.specifications = specs
}

function extractKeyValuePair(currentLine: string, nextLine?: string): { key: string; value: string } | null {
  const key = currentLine.replace(/[:：]/g, '').trim()
  
  // Проверяем, что ключ подходящий
  const isValidKey = key && 
    key.length < 50 && 
    !key.match(/^\d+$/) && 
    key.match(/[а-яёa-z]/i) &&
    !key.toLowerCase().includes('коммерческое') &&
    !key.toLowerCase().includes('стоимость')
  
  if (!isValidKey) return null
  
  // Проверяем значение
  if (nextLine) {
    const value = nextLine.trim()
    const isValidValue = value && 
      value.length < 100 && 
      !value.toLowerCase().includes('характеристики') &&
      !value.toLowerCase().includes('техники')
    
    if (isValidValue) {
      return { key, value }
    }
  }
  
  return null
}

function extractFromSingleLine(line: string): { key: string; value: string } | null {
  // Пытаемся найти разделитель : или -
  const separators = [':', '：', '-', '—']
  
  for (const separator of separators) {
    const parts = line.split(separator)
    if (parts.length === 2) {
      const key = parts[0].trim()
      const value = parts[1].trim()
      
      const isValidKey = key && key.length < 50 && !key.match(/^\d+$/) && key.match(/[а-яёa-z]/i)
      const isValidValue = value && value.length < 100
      
      if (isValidKey && isValidValue) {
        return { key, value }
      }
    }
  }
  
  return null
}

function extractSpecsFromFullText(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Пропускаем строки с ценами и заголовками
    if (line.toLowerCase().includes('руб') || 
        line.toLowerCase().includes('стоимость') ||
        line.toLowerCase().includes('коммерческое')) {
      continue
    }
    
    // Пытаемся извлечь как пару ключ-значение
    const keyValue = extractKeyValuePair(line, lines[i + 1]) || extractFromSingleLine(line)
    if (keyValue) {
      specs[keyValue.key] = keyValue.value
      if (extractKeyValuePair(line, lines[i + 1])) {
        i++ // Пропускаем следующую строку
      }
    }
  }
}

function extractWithPatterns(specs: Record<string, string>, normalizedText: string) {
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
