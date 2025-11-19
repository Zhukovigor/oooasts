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
    data.title = lines.find(l => l.toLowerCase().includes('volvo') || l.toLowerCase().includes('komatsu') || l.toLowerCase().includes('fh') || l.toLowerCase().includes('cam'))?.trim() || lines[0].trim()
  }

  // Извлечение типа техники
  const equipmentLine = lines.find(l => l.toLowerCase().includes('тягач') || l.toLowerCase().includes('экскаватор') || l.toLowerCase().includes('погрузчик') || l.toLowerCase().includes('бетонораспределитель'))
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
  if (normalizedText.includes('безналичная')) data.paymentType = 'Безналичная оплата с НДС'
  if (normalizedText.includes('диагностикапройдена')) data.diagnosticsPassed = true

  const specs: Record<string, string> = {}
  const lines_for_specs = text.split('\n').map(l => l.trim()).filter(l => l)
  
  for (let i = 0; i < lines_for_specs.length - 1; i++) {
    const key = lines_for_specs[i]
    const value = lines_for_specs[i + 1]
    
    // Пропускаем строки которые это явно заголовки или числа
    const isKeyLike = key && key.length < 50 && !key.match(/^\d+/) && key.match(/[а-яёА-ЯЁ]/)
    const isValueLike = value && value.length < 100 && !value.toLowerCase().includes('характеристики') && !value.toLowerCase().includes('техники')
    
    if (isKeyLike && isValueLike && !key.toLowerCase().includes('коммерческое') && !key.toLowerCase().includes('стоимость')) {
      specs[key] = value
      i++ // Пропускаем следующую строку т.к. она была использована как значение
    }
  }

  data.specifications = specs
  return data
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  const entries = Object.entries(specs).filter(([k, v]) => k && v)
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
