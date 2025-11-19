// Parser for extracting commercial offer data from text

export interface CommercialOfferData {
  title?: string;
  equipment?: string;
  model?: string;
  price?: number;
  priceWithVat?: number;
  availability?: string;
  paymentType?: string;
  vatIncluded?: boolean;
  diagnosticsPassed?: boolean;
  specifications?: Record<string, any>;
  engine?: Record<string, string>;
  wheelFormula?: string;
  suspension?: string;
  year?: number;
  mileage?: string;
}

const categories = {
  engine: ['двигатель', 'двигатель', 'мощность', 'мощностьдвигателя', 'топливо', 'типтоплива'],
  specifications: ['модель', 'марка', 'год', 'годвыпуска', 'пробег', 'тип', 'типкабины', 'цвет', 'цветкузова'],
  suspension: ['подвеска', 'типподвески', 'колеснаяформула'],
  brakes: ['тормоза', 'типтормозов'],
  transmission: ['коробка', 'типкпп', 'кпп'],
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
    engine: {},
  }

  // Remove extra whitespace and normalize
  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim()

  // Parse title (first line usually)
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length > 0) {
    data.title = lines[0].trim()
  }

  // Parse price
  const priceMatch = normalizedText.match(/стоимость[^:]*:\s*([\d\s]+)\s*руб/i)
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/\s/g, ''))
  }

  // Parse price with VAT
  const priceVatMatch = normalizedText.match(/стоимостьсндс[^:]*:\s*([\d\s]+)\s*руб/i)
  if (priceVatMatch) {
    data.priceWithVat = parseInt(priceVatMatch[1].replace(/\s/g, ''))
  }

  // Parse availability
  if (normalizedText.includes('вналичии')) {
    data.availability = 'В наличии'
  } else if (normalizedText.includes('заказ')) {
    data.availability = 'На заказ'
  }

  // Parse payment type
  if (normalizedText.includes('лизинг')) {
    data.paymentType = 'Лизинг'
  }
  if (normalizedText.includes('безналичная')) {
    data.paymentType = 'Безналичные'
  }

  // Parse VAT
  data.vatIncluded = normalizedText.includes('сндс')

  // Parse diagnostics
  data.diagnosticsPassed = normalizedText.includes('диагностикапройдена')

  // Parse specifications - extract key:value pairs
  const specRegex = /([а-яёa-z\s]+):\s*([^\n:]+)(?=\n|$)/gi
  let match
  
  while ((match = specRegex.exec(text)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '')
    const value = match[2].trim()

    // Categorize the specification
    if (categories.engine.some(c => key.includes(c))) {
      data.engine![key] = value
    } else {
      data.specifications![key] = value
    }

    // Extract specific fields
    if (key.includes('модель')) data.model = value
    if (key.includes('марка')) data.equipment = value
    if (key.includes('год')) data.year = parseInt(value)
    if (key.includes('пробег')) data.mileage = value
    if (key.includes('колеснаяформула')) data.wheelFormula = value
    if (key.includes('типподвески')) data.suspension = value
  }

  return data
}

export function formatSpecificationsForDisplay(
  specs: Record<string, any>
): { category: string; items: Array<{ key: string; value: string }> }[] {
  const result: { category: string; items: Array<{ key: string; value: string }> }[] = []

  const categoryMap: Record<string, string[]> = {
    'Двигатель': ['двигатель', 'мощность', 'топливо', 'мощностьдвигателя', 'типтоплива'],
    'Основные параметры': ['модель', 'марка', 'год', 'пробег', 'тип'],
    'Ходовая часть': ['колеснаяформула', 'подвеска', 'типподвески', 'тормоза'],
    'Кабина': ['типкабины', 'цвет', 'цветкузова'],
    'КПП': ['кпп', 'типкпп'],
  }

  for (const [category, keys] of Object.entries(categoryMap)) {
    const items: Array<{ key: string; value: string }> = []

    for (const key of keys) {
      for (const [specKey, specValue] of Object.entries(specs)) {
        if (specKey.toLowerCase().includes(key.toLowerCase())) {
          items.push({
            key: humanizeKey(specKey),
            value: String(specValue),
          })
        }
      }
    }

    if (items.length > 0) {
      result.push({ category, items })
    }
  }

  return result
}

function humanizeKey(key: string): string {
  const humanMap: Record<string, string> = {
    модель: 'Модель',
    марка: 'Марка',
    год: 'Год выпуска',
    пробег: 'Пробег',
    типкабины: 'Тип кабины',
    цветкузова: 'Цвет кузова',
    мощностьдвигателя: 'Мощность двигателя',
    типтоплива: 'Тип топлива',
    колеснаяформула: 'Колесная формула',
    типподвески: 'Тип подвески',
    тормоза: 'Тормоза',
    типкпп: 'Тип КПП',
  }

  return humanMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1)
}
