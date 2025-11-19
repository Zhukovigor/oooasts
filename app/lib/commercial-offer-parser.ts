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

const categoryKeywords = {
  engine: ['двигатель', 'мощность', 'топливо', 'евро'],
  basic: ['модель', 'марка', 'год', 'пробег', 'тип'],
  chassis: ['колеснаяформула', 'подвеска', 'тормоза', 'кпп'],
  cabin: ['кабина', 'цвет', 'место'],
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  }

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim()
  const lines = text.split('\n').filter(l => l.trim())

  // Извлечение названия и типа техники
  if (lines.length > 0) {
    data.title = lines.find(l => l.toLowerCase().includes('volvo') || l.toLowerCase().includes('кomatsu') || l.toLowerCase().includes('fh') || l.toLowerCase().includes('cam'))?.trim() || lines[0].trim()
  }

  // Извлечение типа техники
  const equipmentLine = lines.find(l => l.toLowerCase().includes('тягач') || l.toLowerCase().includes('экскаватор') || l.toLowerCase().includes('погрузчик'))
  if (equipmentLine) {
    data.equipment = equipmentLine.trim()
  }

  // Извлечение цены
  const priceMatch = normalizedText.match(/стоимость[^:]*:\s*([\d\s]+)\s*руб/i)
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/\s/g, ''))
  }

  // Условия покупки
  if (normalizedText.includes('сндс')) data.priceWithVat = true
  if (normalizedText.includes('вналичии')) data.availability = 'В наличии'
  if (normalizedText.includes('лизинг')) data.lease = true
  if (normalizedText.includes('безналичная')) data.paymentType = 'Безналичная'
  if (normalizedText.includes('диагностикапройдена')) data.diagnosticsPassed = true

  // Парсинг характеристик
  const specRegex = /([а-яё\s]+):\s*([^\n:]+)(?=\n|$)/gi
  let match
  const specs: Record<string, string> = {}

  while ((match = specRegex.exec(text)) !== null) {
    const key = match[1].trim()
    const value = match[2].trim()
    
    if (key && value && value.length < 100) {
      specs[key] = value
    }
  }

  data.specifications = specs
  return data
}

export function formatSpecsForTable(specs: Record<string, string>): Array<[string, string][]> {
  const entries = Object.entries(specs)
  const rows: Array<[string, string][]> = []
  
  for (let i = 0; i < entries.length; i += 2) {
    const row: [string, string][] = []
    row.push(entries[i])
    if (i + 1 < entries.length) {
      row.push(entries[i + 1])
    }
    rows.push(row)
  }
  
  return rows
}
