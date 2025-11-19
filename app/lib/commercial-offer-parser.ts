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
  basic: ['модель', 'марка', 'год', 'пробег', 'тип', 'состояние', 'vin', 'госномер'],
  engine: ['двигатель', 'мощность', 'топливо', 'евро', 'объем', 'л.с.', 'крутящий', 'цилиндр', 'турбо'],
  transmission: ['кпп', 'коробка', 'трансмиссия', 'передач', 'сцепление', 'привод'],
  chassis: ['колесная', 'подвеска', 'тормоза', 'мост', 'дифференциал', 'рулевое', 'шины'],
  cabin: ['кабина', 'цвет', 'место', 'спальное', 'кондиционер', 'круиз', 'обогрев', 'сиденье', 'отделка'],
  dimensions: ['габариты', 'длина', 'ширина', 'высота', 'масса', 'грузоподъемность', 'объем', 'размер'],
  additional: ['комплектация', 'опции', 'оборудование', 'дополнительно', 'особенности']
} as const;

// Улучшенные регулярные выражения с приоритетами
const patterns = {
  price: [
    { pattern: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+(?:\s?\d{3})*)\s*руб/i, priority: 1 },
    { pattern: /([\d\s]+(?:\s?\d{3})*)\s*руб(?!.*пробег)/i, priority: 2 },
    { pattern: /цена[^.\n]*?([\d\s]+(?:\s?\d{3})*)/i, priority: 3 }
  ],
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс|включая\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке|на\s*складе)/i,
  lease: /(?:лизинг|аренда|рассрочк|финансирование)/i,
  paymentType: /(?:безналичн|нал\s*[\/\\]\s*безнал|перевод|карт|электронн)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр|исправен)/i,
  year: /(?:год|г\.?в?\.?|выпуск)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+(?:\s?\d{3})*)\s*(?:км|km)/i,
  model: /(?:модель|серия)[^:]*:?\s*([^\n,|]+)/i,
  brand: /(?:марка|производитель)[^:]*:?\s*([^\n,|]+)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран|бульдозер|автокран)/i,
  engine: /(?:двигатель|мотор)[^:]*:?\s*([^\n,|]+)/i,
  power: /(?:мощность|сила)[^:]*:?\s*([\d\s]+)\s*(?:л\.?с?\.?|квт)/i
} as const;

// Популярные бренды для автоматического определения
const COMMON_BRANDS = [
  'volvo', 'scania', 'man', 'daf', 'renault', 'iveco', 'mercedes', 'benz',
  'kamaz', 'maz', 'kraz', 'zil', 'gaz', 'ural', 'chevrolet', 'ford',
  'isuzu', 'mitsubishi', 'nissan', 'toyota', 'hino', 'hyundai',
  'caterpillar', 'cat', 'komatsu', 'hitachi', 'liebherr', 'jcb',
  'doosan', 'case', 'new holland', 'john deere'
] as const;

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = normalizeText(text);
  const lines = preprocessLines(text);

  // Извлечение основных данных с приоритетами
  extractEquipmentAndTitle(data, lines, normalizedText);
  extractPricingAndConditions(data, normalizedText);
  extractSpecifications(data, text, normalizedText);
  postProcessData(data);

  return data;
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[•\-]\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function preprocessLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             trimmed !== 'я' && 
             trimmed.length > 1 && 
             !trimmed.match(/^[=\-\*_]{3,}$/);
    });
}

function extractEquipmentAndTitle(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск типа оборудования
  const equipmentMatch = normalizedText.match(patterns.equipment);
  if (equipmentMatch) {
    data.equipment = capitalizeFirst(equipmentMatch[0]);
  }

  // Поиск в заголовочных строках
  const headerLines = lines.slice(0, 5);
  
  // Поиск бренда и модели
  let foundBrand: string | null = null;
  let foundModel: string | null = null;

  for (const line of headerLines) {
    const lowerLine = line.toLowerCase();
    
    // Поиск бренда
    for (const brand of COMMON_BRANDS) {
      if (lowerLine.includes(brand) && !foundBrand) {
        foundBrand = brand;
        
        // Попытка извлечь модель
        const words = line.split(/\s+/);
        const brandIndex = words.findIndex(word => 
          word.toLowerCase().includes(brand)
        );
        
        if (brandIndex !== -1) {
          // Ищем модель после бренда
          if (brandIndex + 1 < words.length) {
            foundModel = words[brandIndex + 1];
          }
          
          // Формируем заголовок
          data.title = line.trim();
          break;
        }
      }
    }
    
    if (foundBrand) break;
  }

  // Если не нашли в заголовках, ищем во всем тексте
  if (!foundBrand) {
    for (const brand of COMMON_BRANDS) {
      if (normalizedText.includes(brand)) {
        foundBrand = brand;
        break;
      }
    }
  }

  // Формирование итогового заголовка
  if (!data.title) {
    if (foundBrand && foundModel) {
      data.title = `${capitalizeFirst(foundBrand)} ${foundModel}`;
    } else if (foundBrand) {
      data.title = capitalizeFirst(foundBrand);
    } else if (headerLines.length > 0) {
      data.title = headerLines[0];
    }
  }

  // Добавляем оборудование к заголовку если нужно
  if (data.equipment && data.title && 
      !data.title.toLowerCase().includes(data.equipment.toLowerCase())) {
    data.title = `${data.equipment} ${data.title}`;
  }

  // Сохраняем модель если нашли
  if (foundModel && !data.model) {
    data.model = foundModel;
  }
}

function extractPricingAndConditions(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены с приоритетами
  for (const pricePattern of patterns.price) {
    const match = normalizedText.match(pricePattern.pattern);
    if (match) {
      const priceStr = match[1].replace(/\s/g, '');
      if (isValidPrice(priceStr)) {
        data.price = parseInt(priceStr);
        break;
      }
    }
  }

  // Условия покупки
  if (patterns.priceWithVat.test(normalizedText)) {
    data.priceWithVat = true;
    data.vatIncluded = true;
  }
  
  if (patterns.availability.test(normalizedText)) {
    data.availability = 'В наличии';
  }
  
  if (patterns.lease.test(normalizedText)) {
    data.lease = true;
  }
  
  if (patterns.paymentType.test(normalizedText)) {
    data.paymentType = 'Безналичная оплата с НДС';
  }
  
  if (patterns.diagnostics.test(normalizedText)) {
    data.diagnosticsPassed = true;
  }
}

function extractSpecifications(data: CommercialOfferData, originalText: string, normalizedText: string) {
  const specs: Record<string, string> = {};
  const lines = preprocessLines(originalText);
  
  // Приоритетные методы извлечения
  extractWithRegex(specs, normalizedText);
  extractTableData(specs, lines);
  extractKeyValuePairs(specs, lines);
  extractFromStructuredText(specs, lines);
  
  // Очистка и нормализация спецификаций
  data.specifications = cleanSpecifications(specs);
}

function extractWithRegex(specs: Record<string, string>, normalizedText: string) {
  const regexExtractions = [
    { pattern: patterns.year, key: 'Год выпуска' },
    { pattern: patterns.mileage, key: 'Пробег', transform: (val: string) => `${val.replace(/\s/g, '')} км` },
    { pattern: patterns.model, key: 'Модель' },
    { pattern: patterns.brand, key: 'Марка' },
    { pattern: patterns.engine, key: 'Двигатель' },
    { pattern: patterns.power, key: 'Мощность', transform: (val: string) => `${val.replace(/\s/g, '')} л.с.` },
  ];

  for (const extraction of regexExtractions) {
    const match = normalizedText.match(extraction.pattern);
    if (match && !specs[extraction.key]) {
      const value = extraction.transform ? extraction.transform(match[1]) : match[1].trim();
      if (isValidValue(value)) {
        specs[extraction.key] = capitalizeFirst(value);
      }
    }
  }
}

function extractTableData(specs: Record<string, string>, lines: string[]) {
  for (const line of lines) {
    // Обработка различных разделителей таблицы
    const separators = ['\t', '|', '  ', ' - '];
    
    for (const separator of separators) {
      if (line.includes(separator)) {
        const parts = line.split(separator).map(part => part.trim()).filter(part => part);
        
        // Обработка пар ключ-значение
        for (let i = 0; i < parts.length - 1; i += 2) {
          const key = parts[i];
          const value = parts[i + 1];
          
          if (isValidKey(key) && isValidValue(value) && !specs[key]) {
            specs[key] = value;
          }
        }
        break;
      }
    }
  }
}

function extractKeyValuePairs(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    // Пытаемся извлечь из одной строки
    const singleLineResult = extractFromSingleLine(lines[i]);
    if (singleLineResult) {
      specs[singleLineResult.key] = singleLineResult.value;
      continue;
    }
    
    // Пытаемся извлечь из двух последовательных строк
    if (i < lines.length - 1) {
      const key = lines[i];
      const value = lines[i + 1];
      
      if (isValidKey(key) && isValidValue(value) && !specs[key]) {
        specs[key] = value;
        i++; // Пропускаем следующую строку
      }
    }
  }
}

function extractFromSingleLine(line: string): { key: string; value: string } | null {
  const separators = [':', ' - ', ' — ', ' • ', '   '];
  
  for (const separator of separators) {
    const parts = line.split(separator).map(part => part.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const key = parts[0];
      const value = parts.slice(1).join(separator).trim();
      
      if (isValidKey(key) && isValidValue(value)) {
        return { key, value };
      }
    }
  }
  
  return null;
}

function extractFromStructuredText(specs: Record<string, string>, lines: string[]) {
  const commonSpecs = {
    'Тип кабины': ['кабина', 'тип кабины', 'количество мест'],
    'Колесная формула': ['колесная формула', 'колесная', 'формула'],
    'Тип подвески': ['подвеска', 'тип подвески'],
    'Тормоза': ['тормоза', 'тормозная система'],
    'Вид топлива': ['топливо', 'вид топлива', 'тип топлива'],
    'Цвет кузова': ['цвет', 'окраска', 'цвет кузова'],
    'Коробка передач': ['кпп', 'коробка', 'трансмиссия']
  };

  for (const [specKey, keywords] of Object.entries(commonSpecs)) {
    if (specs[specKey]) continue;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          // Пытаемся извлечь значение после ключевого слова
          const match = line.match(new RegExp(`${keyword}[^:]*:?\\s*([^,\\.\\n]+)`, 'i'));
          if (match && match[1].trim()) {
            specs[specKey] = match[1].trim();
            break;
          }
        }
      }
      if (specs[specKey]) break;
    }
  }
}

function cleanSpecifications(specs: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(specs)) {
    if (isValidKey(key) && isValidValue(value)) {
      // Нормализация ключа
      const cleanKey = key
        .replace(/[•\-]\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Нормализация значения
      const cleanValue = value
        .replace(/^[:\-•]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanKey && cleanValue && !cleaned[cleanKey]) {
        cleaned[cleanKey] = cleanValue;
      }
    }
  }
  
  return cleaned;
}

function postProcessData(data: CommercialOfferData) {
  // Автозаполнение недостающих полей на основе спецификаций
  if (!data.model && data.specifications?.['Модель']) {
    data.model = data.specifications['Модель'];
  }
  
  if (!data.equipment && data.title) {
    const equipmentMatch = data.title.match(patterns.equipment);
    if (equipmentMatch) {
      data.equipment = capitalizeFirst(equipmentMatch[0]);
    }
  }
  
  // Нормализация цены с НДС
  if (data.vatIncluded && !data.priceWithVat) {
    data.priceWithVat = true;
  }
}

// Вспомогательные функции
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isValidPrice(priceStr: string): boolean {
  if (!priceStr || priceStr === '1') return false;
  const price = parseInt(priceStr);
  return !isNaN(price) && price > 1000 && price < 1000000000;
}

function isValidKey(key: string): boolean {
  if (!key || key.length < 1 || key.length > 100) return false;
  if (key.match(/^\d+$/)) return false;
  if (!key.match(/[а-яёa-z]/i)) return false;
  
  const invalidPatterns = [
    'коммерческое', 'стоимость', 'руб', 'цена', 'предложение',
    'я', 'характеристики', 'техника', 'описание'
  ];
  
  const lowerKey = key.toLowerCase();
  return !invalidPatterns.some(pattern => lowerKey.includes(pattern));
}

function isValidValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 200) return false;
  
  const invalidPatterns = [
    'характеристики', 'техники', 'я', 'описание',
    'коммерческое предложение'
  ];
  
  const lowerValue = value.toLowerCase();
  return !invalidPatterns.some(pattern => lowerValue.includes(pattern));
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([keyA], [keyB]) => {
      const getCategoryPriority = (key: string): number => {
        const lowerKey = key.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => lowerKey.includes(kw))) {
            const categoryOrder = ['basic', 'engine', 'transmission', 'chassis', 'cabin', 'dimensions', 'additional'];
            return categoryOrder.indexOf(category);
          }
        }
        return 999; // other
      };
      
      return getCategoryPriority(keyA) - getCategoryPriority(keyB);
    });

  const rows: Array<Array<[string, string]>> = [];
  
  // Создаем строки по 2 колонки
  for (let i = 0; i < entries.length; i += 2) {
    const row: Array<[string, string]> = [entries[i]];
    if (i + 1 < entries.length) {
      row.push(entries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}

// Дополнительная утилита для оценки качества парсинга
export function getParsingQuality(data: CommercialOfferData): number {
  let score = 0;
  const maxScore = 100;
  
  if (data.title) score += 20;
  if (data.price && data.price > 0) score += 25;
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    score += Math.min(30, Object.keys(data.specifications).length * 3);
  }
  if (data.equipment) score += 10;
  if (data.model) score += 5;
  if (data.availability) score += 5;
  if (data.paymentType) score += 5;
  
  return Math.min(score, maxScore);
}// Parser for extracting commercial offer data from text

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
  basic: ['модель', 'марка', 'год', 'пробег', 'тип', 'состояние', 'vin', 'госномер'],
  engine: ['двигатель', 'мощность', 'топливо', 'евро', 'объем', 'л.с.', 'крутящий', 'цилиндр', 'турбо'],
  transmission: ['кпп', 'коробка', 'трансмиссия', 'передач', 'сцепление', 'привод'],
  chassis: ['колесная', 'подвеска', 'тормоза', 'мост', 'дифференциал', 'рулевое', 'шины'],
  cabin: ['кабина', 'цвет', 'место', 'спальное', 'кондиционер', 'круиз', 'обогрев', 'сиденье', 'отделка'],
  dimensions: ['габариты', 'длина', 'ширина', 'высота', 'масса', 'грузоподъемность', 'объем', 'размер'],
  additional: ['комплектация', 'опции', 'оборудование', 'дополнительно', 'особенности']
} as const;

// Улучшенные регулярные выражения с приоритетами
const patterns = {
  price: [
    { pattern: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+(?:\s?\d{3})*)\s*руб/i, priority: 1 },
    { pattern: /([\d\s]+(?:\s?\d{3})*)\s*руб(?!.*пробег)/i, priority: 2 },
    { pattern: /цена[^.\n]*?([\d\s]+(?:\s?\d{3})*)/i, priority: 3 }
  ],
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс|включая\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке|на\s*складе)/i,
  lease: /(?:лизинг|аренда|рассрочк|финансирование)/i,
  paymentType: /(?:безналичн|нал\s*[\/\\]\s*безнал|перевод|карт|электронн)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр|исправен)/i,
  year: /(?:год|г\.?в?\.?|выпуск)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+(?:\s?\d{3})*)\s*(?:км|km)/i,
  model: /(?:модель|серия)[^:]*:?\s*([^\n,|]+)/i,
  brand: /(?:марка|производитель)[^:]*:?\s*([^\n,|]+)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран|бульдозер|автокран)/i,
  engine: /(?:двигатель|мотор)[^:]*:?\s*([^\n,|]+)/i,
  power: /(?:мощность|сила)[^:]*:?\s*([\d\s]+)\s*(?:л\.?с?\.?|квт)/i
} as const;

// Популярные бренды для автоматического определения
const COMMON_BRANDS = [
  'volvo', 'scania', 'man', 'daf', 'renault', 'iveco', 'mercedes', 'benz',
  'kamaz', 'maz', 'kraz', 'zil', 'gaz', 'ural', 'chevrolet', 'ford',
  'isuzu', 'mitsubishi', 'nissan', 'toyota', 'hino', 'hyundai',
  'caterpillar', 'cat', 'komatsu', 'hitachi', 'liebherr', 'jcb',
  'doosan', 'case', 'new holland', 'john deere'
] as const;

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = normalizeText(text);
  const lines = preprocessLines(text);

  // Извлечение основных данных с приоритетами
  extractEquipmentAndTitle(data, lines, normalizedText);
  extractPricingAndConditions(data, normalizedText);
  extractSpecifications(data, text, normalizedText);
  postProcessData(data);

  return data;
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[•\-]\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function preprocessLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    )
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             trimmed !== 'я' && 
             trimmed.length > 1 && 
             !trimmed.match(/^[=\-\*_]{3,}$/);
    });
}

function extractEquipmentAndTitle(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск типа оборудования
  const equipmentMatch = normalizedText.match(patterns.equipment);
  if (equipmentMatch) {
    data.equipment = capitalizeFirst(equipmentMatch[0]);
  }

  // Поиск в заголовочных строках
  const headerLines = lines.slice(0, 5);
  
  // Поиск бренда и модели
  let foundBrand: string | null = null;
  let foundModel: string | null = null;

  for (const line of headerLines) {
    const lowerLine = line.toLowerCase();
    
    // Поиск бренда
    for (const brand of COMMON_BRANDS) {
      if (lowerLine.includes(brand) && !foundBrand) {
        foundBrand = brand;
        
        // Попытка извлечь модель
        const words = line.split(/\s+/);
        const brandIndex = words.findIndex(word => 
          word.toLowerCase().includes(brand)
        );
        
        if (brandIndex !== -1) {
          // Ищем модель после бренда
          if (brandIndex + 1 < words.length) {
            foundModel = words[brandIndex + 1];
          }
          
          // Формируем заголовок
          data.title = line.trim();
          break;
        }
      }
    }
    
    if (foundBrand) break;
  }

  // Если не нашли в заголовках, ищем во всем тексте
  if (!foundBrand) {
    for (const brand of COMMON_BRANDS) {
      if (normalizedText.includes(brand)) {
        foundBrand = brand;
        break;
      }
    }
  }

  // Формирование итогового заголовка
  if (!data.title) {
    if (foundBrand && foundModel) {
      data.title = `${capitalizeFirst(foundBrand)} ${foundModel}`;
    } else if (foundBrand) {
      data.title = capitalizeFirst(foundBrand);
    } else if (headerLines.length > 0) {
      data.title = headerLines[0];
    }
  }

  // Добавляем оборудование к заголовку если нужно
  if (data.equipment && data.title && 
      !data.title.toLowerCase().includes(data.equipment.toLowerCase())) {
    data.title = `${data.equipment} ${data.title}`;
  }

  // Сохраняем модель если нашли
  if (foundModel && !data.model) {
    data.model = foundModel;
  }
}

function extractPricingAndConditions(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены с приоритетами
  for (const pricePattern of patterns.price) {
    const match = normalizedText.match(pricePattern.pattern);
    if (match) {
      const priceStr = match[1].replace(/\s/g, '');
      if (isValidPrice(priceStr)) {
        data.price = parseInt(priceStr);
        break;
      }
    }
  }

  // Условия покупки
  if (patterns.priceWithVat.test(normalizedText)) {
    data.priceWithVat = true;
    data.vatIncluded = true;
  }
  
  if (patterns.availability.test(normalizedText)) {
    data.availability = 'В наличии';
  }
  
  if (patterns.lease.test(normalizedText)) {
    data.lease = true;
  }
  
  if (patterns.paymentType.test(normalizedText)) {
    data.paymentType = 'Безналичная оплата с НДС';
  }
  
  if (patterns.diagnostics.test(normalizedText)) {
    data.diagnosticsPassed = true;
  }
}

function extractSpecifications(data: CommercialOfferData, originalText: string, normalizedText: string) {
  const specs: Record<string, string> = {};
  const lines = preprocessLines(originalText);
  
  // Приоритетные методы извлечения
  extractWithRegex(specs, normalizedText);
  extractTableData(specs, lines);
  extractKeyValuePairs(specs, lines);
  extractFromStructuredText(specs, lines);
  
  // Очистка и нормализация спецификаций
  data.specifications = cleanSpecifications(specs);
}

function extractWithRegex(specs: Record<string, string>, normalizedText: string) {
  const regexExtractions = [
    { pattern: patterns.year, key: 'Год выпуска' },
    { pattern: patterns.mileage, key: 'Пробег', transform: (val: string) => `${val.replace(/\s/g, '')} км` },
    { pattern: patterns.model, key: 'Модель' },
    { pattern: patterns.brand, key: 'Марка' },
    { pattern: patterns.engine, key: 'Двигатель' },
    { pattern: patterns.power, key: 'Мощность', transform: (val: string) => `${val.replace(/\s/g, '')} л.с.` },
  ];

  for (const extraction of regexExtractions) {
    const match = normalizedText.match(extraction.pattern);
    if (match && !specs[extraction.key]) {
      const value = extraction.transform ? extraction.transform(match[1]) : match[1].trim();
      if (isValidValue(value)) {
        specs[extraction.key] = capitalizeFirst(value);
      }
    }
  }
}

function extractTableData(specs: Record<string, string>, lines: string[]) {
  for (const line of lines) {
    // Обработка различных разделителей таблицы
    const separators = ['\t', '|', '  ', ' - '];
    
    for (const separator of separators) {
      if (line.includes(separator)) {
        const parts = line.split(separator).map(part => part.trim()).filter(part => part);
        
        // Обработка пар ключ-значение
        for (let i = 0; i < parts.length - 1; i += 2) {
          const key = parts[i];
          const value = parts[i + 1];
          
          if (isValidKey(key) && isValidValue(value) && !specs[key]) {
            specs[key] = value;
          }
        }
        break;
      }
    }
  }
}

function extractKeyValuePairs(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    // Пытаемся извлечь из одной строки
    const singleLineResult = extractFromSingleLine(lines[i]);
    if (singleLineResult) {
      specs[singleLineResult.key] = singleLineResult.value;
      continue;
    }
    
    // Пытаемся извлечь из двух последовательных строк
    if (i < lines.length - 1) {
      const key = lines[i];
      const value = lines[i + 1];
      
      if (isValidKey(key) && isValidValue(value) && !specs[key]) {
        specs[key] = value;
        i++; // Пропускаем следующую строку
      }
    }
  }
}

function extractFromSingleLine(line: string): { key: string; value: string } | null {
  const separators = [':', ' - ', ' — ', ' • ', '   '];
  
  for (const separator of separators) {
    const parts = line.split(separator).map(part => part.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const key = parts[0];
      const value = parts.slice(1).join(separator).trim();
      
      if (isValidKey(key) && isValidValue(value)) {
        return { key, value };
      }
    }
  }
  
  return null;
}

function extractFromStructuredText(specs: Record<string, string>, lines: string[]) {
  const commonSpecs = {
    'Тип кабины': ['кабина', 'тип кабины', 'количество мест'],
    'Колесная формула': ['колесная формула', 'колесная', 'формула'],
    'Тип подвески': ['подвеска', 'тип подвески'],
    'Тормоза': ['тормоза', 'тормозная система'],
    'Вид топлива': ['топливо', 'вид топлива', 'тип топлива'],
    'Цвет кузова': ['цвет', 'окраска', 'цвет кузова'],
    'Коробка передач': ['кпп', 'коробка', 'трансмиссия']
  };

  for (const [specKey, keywords] of Object.entries(commonSpecs)) {
    if (specs[specKey]) continue;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of keywords) {
        if (lowerLine.includes(keyword)) {
          // Пытаемся извлечь значение после ключевого слова
          const match = line.match(new RegExp(`${keyword}[^:]*:?\\s*([^,\\.\\n]+)`, 'i'));
          if (match && match[1].trim()) {
            specs[specKey] = match[1].trim();
            break;
          }
        }
      }
      if (specs[specKey]) break;
    }
  }
}

function cleanSpecifications(specs: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(specs)) {
    if (isValidKey(key) && isValidValue(value)) {
      // Нормализация ключа
      const cleanKey = key
        .replace(/[•\-]\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Нормализация значения
      const cleanValue = value
        .replace(/^[:\-•]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanKey && cleanValue && !cleaned[cleanKey]) {
        cleaned[cleanKey] = cleanValue;
      }
    }
  }
  
  return cleaned;
}

function postProcessData(data: CommercialOfferData) {
  // Автозаполнение недостающих полей на основе спецификаций
  if (!data.model && data.specifications?.['Модель']) {
    data.model = data.specifications['Модель'];
  }
  
  if (!data.equipment && data.title) {
    const equipmentMatch = data.title.match(patterns.equipment);
    if (equipmentMatch) {
      data.equipment = capitalizeFirst(equipmentMatch[0]);
    }
  }
  
  // Нормализация цены с НДС
  if (data.vatIncluded && !data.priceWithVat) {
    data.priceWithVat = true;
  }
}

// Вспомогательные функции
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function isValidPrice(priceStr: string): boolean {
  if (!priceStr || priceStr === '1') return false;
  const price = parseInt(priceStr);
  return !isNaN(price) && price > 1000 && price < 1000000000;
}

function isValidKey(key: string): boolean {
  if (!key || key.length < 1 || key.length > 100) return false;
  if (key.match(/^\d+$/)) return false;
  if (!key.match(/[а-яёa-z]/i)) return false;
  
  const invalidPatterns = [
    'коммерческое', 'стоимость', 'руб', 'цена', 'предложение',
    'я', 'характеристики', 'техника', 'описание'
  ];
  
  const lowerKey = key.toLowerCase();
  return !invalidPatterns.some(pattern => lowerKey.includes(pattern));
}

function isValidValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 200) return false;
  
  const invalidPatterns = [
    'характеристики', 'техники', 'я', 'описание',
    'коммерческое предложение'
  ];
  
  const lowerValue = value.toLowerCase();
  return !invalidPatterns.some(pattern => lowerValue.includes(pattern));
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([keyA], [keyB]) => {
      const getCategoryPriority = (key: string): number => {
        const lowerKey = key.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(kw => lowerKey.includes(kw))) {
            const categoryOrder = ['basic', 'engine', 'transmission', 'chassis', 'cabin', 'dimensions', 'additional'];
            return categoryOrder.indexOf(category);
          }
        }
        return 999; // other
      };
      
      return getCategoryPriority(keyA) - getCategoryPriority(keyB);
    });

  const rows: Array<Array<[string, string]>> = [];
  
  // Создаем строки по 2 колонки
  for (let i = 0; i < entries.length; i += 2) {
    const row: Array<[string, string]> = [entries[i]];
    if (i + 1 < entries.length) {
      row.push(entries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}

// Дополнительная утилита для оценки качества парсинга
export function getParsingQuality(data: CommercialOfferData): number {
  let score = 0;
  const maxScore = 100;
  
  if (data.title) score += 20;
  if (data.price && data.price > 0) score += 25;
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    score += Math.min(30, Object.keys(data.specifications).length * 3);
  }
  if (data.equipment) score += 10;
  if (data.model) score += 5;
  if (data.availability) score += 5;
  if (data.paymentType) score += 5;
  
  return Math.min(score, maxScore);
}
