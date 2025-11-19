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
  imageUrl?: string;
}

// Расширенный словарь для распознавания различных типов техники и характеристик
const equipmentTypes = {
  тягач: ['седельный тягач', 'тягач', 'грузовик', 'фура'],
  экскаватор: ['экскаватор', 'excavator', 'гусеничный экскаватор', 'колесный экскаватор'],
  погрузчик: ['погрузчик', 'frontloader', 'ковшовый погрузчик', 'вилочный погрузчик'],
  самосвал: ['самосвал', 'dump truck', 'карьерный самосвал'],
  бульдозер: ['бульдозер', 'bulldozer', 'гусеничный бульдозер'],
  автокран: ['автокран', 'кран', 'mobile crane']
};

const brands = {
  volvo: ['volvo', 'вольво'],
  komatsu: ['komatsu', 'коматсу', 'комацу'],
  caterpillar: ['caterpillar', 'cat', 'катерпиллер'],
  man: ['man', 'ман'],
  scania: ['scania', 'скания'],
  kamaz: ['kamaz', 'камаз'],
  liebherr: ['liebherr', 'либхерр'],
  hyundai: ['hyundai', 'хюндай', 'хендай']
};

const specificationPatterns = {
  // Основные характеристики
  марка: ['марка', 'brand', 'производитель'],
  модель: ['модель', 'model'],
  год: ['год выпуска', 'год', 'year', 'г.в.'],
  пробег: ['пробег', 'пробег, км', 'километраж', 'mileage'],
  моточасы: ['моточасы', 'наработка', 'hours'],
  
  // Двигатель
  двигатель: ['двигатель', 'engine', 'мотор'],
  мощность: ['мощность', 'мощность двигателя', 'power', 'л.с.', 'квт'],
  топливо: ['вид топлива', 'топливо', 'fuel', 'дизель', 'бензин'],
  экологический_класс: ['евро', 'екологический класс', 'euro', 'emission'],
  
  // Трансмиссия и ходовая
  кпп: ['тип кпп', 'кпп', 'коробка', 'transmission', 'акпп', 'мкпп'],
  колесная_формула: ['колесная формула', 'формула', 'wheel formula'],
  подвеска: ['тип подвески', 'подвеска', 'suspension'],
  тормоза: ['тормоза', 'brakes', 'тормозная система'],
  
  // Кабина и кузов
  кабина: ['тип кабины', 'кабина', 'cabin', 'спальные места'],
  цвет: ['цвет кузова', 'цвет', 'color'],
  кузов: ['тип кузова', 'кузов', 'body type'],
  
  // Габариты и вес
  грузоподъемность: ['грузоподъемность', 'load capacity', 'тоннаж'],
  объем_кузова: ['объем кузова', 'объем', 'capacity', 'м³'],
  масса: ['снаряженная масса', 'масса', 'weight']
};

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Определение типа техники
  data.equipment = detectEquipmentType(normalizedText, lines);
  
  // Определение марки
  const brand = detectBrand(normalizedText, lines);
  
  // Извлечение названия
  data.title = generateTitle(lines, data.equipment, brand);
  
  // Извлечение цены (расширенная логика)
  data.price = extractPrice(normalizedText, lines);
  
  // Условия покупки (расширенная логика)
  data.priceWithVat = normalizedText.includes('с ндс') || normalizedText.includes('ндс');
  data.availability = extractAvailability(normalizedText, lines);
  data.lease = normalizedText.includes('лизинг') || normalizedText.includes('lease');
  data.paymentType = extractPaymentType(normalizedText);
  data.diagnosticsPassed = normalizedText.includes('диагностика пройдена') || 
                          normalizedText.includes('диагностика пройдена');

  // Расширенный парсинг характеристик
  data.specifications = parseSpecifications(text, normalizedText, lines);

  return data;
}

// Вспомогательные функции

function detectEquipmentType(normalizedText: string, lines: string[]): string {
  for (const [equipmentType, keywords] of Object.entries(equipmentTypes)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        return equipmentType;
      }
    }
  }
  
  // Поиск в первых строках (где обычно указывается тип)
  for (const line of lines.slice(0, 3)) {
    const lowerLine = line.toLowerCase();
    for (const [equipmentType, keywords] of Object.entries(equipmentTypes)) {
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          return equipmentType;
        }
      }
    }
  }
  
  return 'спецтехника';
}

function detectBrand(normalizedText: string, lines: string[]): string {
  for (const [brand, keywords] of Object.entries(brands)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        return brand;
      }
    }
  }
  
  // Поиск в заголовке
  for (const line of lines.slice(0, 2)) {
    const lowerLine = line.toLowerCase();
    for (const [brand, keywords] of Object.entries(brands)) {
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          return brand;
        }
      }
    }
  }
  
  return '';
}

function generateTitle(lines: string[], equipment: string, brand: string): string {
  // Пытаемся найти готовый заголовок в первых строках
  for (const line of lines.slice(0, 3)) {
    if (line && line.length > 5 && !line.includes('стоимость') && !line.includes('технические')) {
      return line;
    }
  }
  
  // Генерируем заголовок на основе обнаруженных данных
  const brandDisplay = brand ? brand.toUpperCase() : '';
  const equipmentDisplay = equipment ? equipment : 'техника';
  
  return `${equipmentDisplay} ${brandDisplay}`.trim();
}

function extractPrice(normalizedText: string, lines: string[]): number {
  // Поиск в формате "Стоимость: X XXX XXX руб"
  const pricePatterns = [
    /стоимость[^:]*:?\s*([\d\s]+)\s*руб/i,
    /цена[^:]*:?\s*([\d\s]+)\s*руб/i,
    /cost[^:]*:?\s*([\d\s]+)\s*rub/i
  ];
  
  for (const pattern of pricePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      return parseInt(match[1].replace(/\s/g, ''));
    }
  }
  
  // Поиск в отдельных строках
  for (const line of lines) {
    const priceMatch = line.match(/([\d\s]+)\s*руб/i);
    if (priceMatch && line.toLowerCase().includes('стоимость')) {
      return parseInt(priceMatch[1].replace(/\s/g, ''));
    }
  }
  
  return 0;
}

function extractAvailability(normalizedText: string, lines: string[]): string {
  if (normalizedText.includes('в наличии')) return 'В наличии';
  if (normalizedText.includes('под заказ')) return 'Под заказ';
  if (normalizedText.includes('ожидается')) return 'Ожидается';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('в наличии')) return 'В наличии';
    if (lowerLine.includes('под заказ')) return 'Под заказ';
  }
  
  return '';
}

function extractPaymentType(normalizedText: string): string {
  if (normalizedText.includes('безналичная')) return 'Безналичная оплата';
  if (normalizedText.includes('наличная')) return 'Наличный расчет';
  if (normalizedText.includes('рассрочка')) return 'Рассрочка';
  return 'Безналичная оплата';
}

function parseSpecifications(originalText: string, normalizedText: string, lines: string[]): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // Парсинг табличных данных
  const tableSpecs = parseTableSpecifications(originalText);
  Object.assign(specs, tableSpecs);
  
  // Парсинг через регулярные выражения
  const specRegex = /([а-яёa-z\s\-]+):\s*([^\n:]+)(?=\n|$)/gi;
  let match;
  
  while ((match = specRegex.exec(originalText)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    
    if (key && value && value.length < 100 && !key.toLowerCase().includes('стоимость')) {
      const normalizedKey = normalizeSpecificationKey(key);
      specs[normalizedKey] = value;
    }
  }
  
  // Дополнительный поиск специфических характеристик
  findAdditionalSpecifications(specs, normalizedText, lines);
  
  return specs;
}

function parseTableSpecifications(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Поиск строк таблицы в формате "| Ключ | Значение |"
    const tableMatch = line.match(/\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (tableMatch && tableMatch[1].trim() && tableMatch[2].trim()) {
      const key = tableMatch[1].trim();
      const value = tableMatch[2].trim();
      if (key && value && !key.toLowerCase().includes('стоимость')) {
        specs[key] = value;
      }
    }
  }
  
  return specs;
}

function normalizeSpecificationKey(key: string): string {
  const lowerKey = key.toLowerCase();
  
  for (const [category, patterns] of Object.entries(specificationPatterns)) {
    for (const pattern of patterns) {
      if (lowerKey.includes(pattern)) {
        return category;
      }
    }
  }
  
  return key;
}

function findAdditionalSpecifications(specs: Record<string, string>, normalizedText: string, lines: string[]) {
  // Поиск специфических характеристик по паттернам
  for (const [category, patterns] of Object.entries(specificationPatterns)) {
    if (!specs[category]) {
      for (const pattern of patterns) {
        for (const line of lines) {
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes(pattern) && !lowerLine.includes(':')) {
            // Пытаемся извлечь значение после ключевого слова
            const patternIndex = lowerLine.indexOf(pattern);
            const valueStart = patternIndex + pattern.length;
            const potentialValue = line.slice(valueStart).trim();
            if (potentialValue && potentialValue.length < 50) {
              specs[category] = potentialValue;
              break;
            }
          }
        }
      }
    }
  }
}

export function formatSpecsForTable(specs: Record<string, string>): Array<[string, string][]> {
  const entries = Object.entries(specs);
  const rows: Array<[string, string][]> = [];
  
  // Сортируем характеристики по категориям для лучшего отображения
  const sortedEntries = entries.sort(([keyA], [keyB]) => {
    const order = Object.keys(specificationPatterns);
    const indexA = order.indexOf(keyA);
    const indexB = order.indexOf(keyB);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  
  for (let i = 0; i < sortedEntries.length; i += 2) {
    const row: [string, string][] = [];
    row.push(sortedEntries[i]);
    if (i + 1 < sortedEntries.length) {
      row.push(sortedEntries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}
