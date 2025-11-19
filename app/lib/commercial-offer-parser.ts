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

// Базовые паттерны для основных полей
const patterns = {
  price: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+(?:\s?\d{3})*)\s*руб/i,
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке)/i,
  lease: /(?:лизинг|аренда|рассрочк)/i,
  paymentType: /(?:безналичн|нал\s*\/\s*безнал|перевод|карт)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран|бульдозер|автокран|каток|фреза|грейдер)/i
} as const;

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const lines = preprocessLines(text);

  // Извлечение основных данных
  extractBasicInfo(data, lines, normalizedText);
  extractPricingInfo(data, normalizedText);
  
  // УНИВЕРСАЛЬНОЕ извлечение ВСЕХ характеристик
  extractAllSpecifications(data, text);

  return data;
}

function preprocessLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             trimmed !== 'я' && 
             trimmed.length > 1 &&
             !isNoiseLine(trimmed);
    });
}

function isNoiseLine(line: string): boolean {
  const noisePatterns = [
    /^[=\-\*_]{3,}$/, // Разделители
    /^(?:коммерческое предложение|технические характеристики|описание)$/i,
    /^\d+$/, // Только цифры
  ];
  
  return noisePatterns.some(pattern => pattern.test(line));
}

function extractBasicInfo(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск оборудования
  const equipmentMatch = normalizedText.match(patterns.equipment);
  if (equipmentMatch) {
    data.equipment = capitalizeFirst(equipmentMatch[0]);
  }

  // Поиск заголовка - ищем строку с брендом и моделью
  for (const line of lines.slice(0, 5)) {
    if (containsBrandAndModel(line)) {
      data.title = line.trim();
      break;
    }
  }

  // Если не нашли подходящий заголовок, используем первую значимую строку
  if (!data.title && lines.length > 0) {
    data.title = lines[0].trim();
  }

  // Извлекаем модель из заголовка
  if (data.title) {
    const modelMatch = data.title.match(/(volvo|scania|man|daf|renault|iveco|mercedes|kamaz)\s+([a-z0-9\s]+)/i);
    if (modelMatch) {
      data.model = modelMatch[2].trim();
    }
  }
}

function containsBrandAndModel(line: string): boolean {
  const brands = ['volvo', 'scania', 'man', 'daf', 'renault', 'iveco', 'mercedes', 'kamaz'];
  return brands.some(brand => line.toLowerCase().includes(brand));
}

function extractPricingInfo(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены
  const priceMatch = normalizedText.match(patterns.price);
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/\s/g, '');
    if (isValidPrice(priceStr)) {
      data.price = parseInt(priceStr);
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

function extractAllSpecifications(data: CommercialOfferData, text: string) {
  const specs: Record<string, string> = {};
  
  // 1. Извлечение из JSON-подобных структур (если есть в тексте)
  extractFromJsonLike(specs, text);
  
  // 2. Извлечение пар ключ-значение с различными разделителями
  extractKeyValuePairs(specs, text);
  
  // 3. Извлечение из структурированного текста
  extractFromStructuredText(specs, text);
  
  // 4. Извлечение технических характеристик по паттернам
  extractTechnicalSpecs(specs, text);
  
  data.specifications = cleanSpecifications(specs);
}

function extractFromJsonLike(specs: Record<string, string>, text: string) {
  // Ищем JSON-подобные структуры: "ключ": "значение"
  const jsonLikeRegex = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let match;
  
  while ((match = jsonLikeRegex.exec(text)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    
    if (isValidSpecKey(key) && isValidSpecValue(value)) {
      specs[key] = value;
    }
  }
}

function extractKeyValuePairs(specs: Record<string, string>, text: string) {
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Различные форматы ключ-значение
    const formats = [
      /([^:]+?)\s*:\s*([^\n]+)/,                    // ключ: значение
      /([^\-]+?)\s*-\s*([^\n]+)/,                   // ключ - значение
      /([^\|]+?)\s*\|\s*([^\n]+)/,                  // ключ | значение
      /([^•]+?)\s*•\s*([^\n]+)/,                    // ключ • значение
    ];
    
    for (const format of formats) {
      const match = line.match(format);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        if (isValidSpecKey(key) && isValidSpecValue(value) && !specs[key]) {
          specs[key] = value;
          break;
        }
      }
    }
  }
}

function extractFromStructuredText(specs: Record<string, string>, text: string) {
  // Извлечение характеристик из описательного текста
  const descriptivePatterns = [
    { regex: /пробег[^\d]*(\d[\d\s]*)\s*км/i, key: 'Пробег', transform: (v: string) => `${v.replace(/\s/g, '')} км` },
    { regex: /год[^\d]*(\d{4})/i, key: 'Год выпуска' },
    { regex: /двигатель[^.]*?([a-z0-9\sё]+?)(?=\.|,|$)/i, key: 'Двигатель' },
    { regex: /мощность[^.]*?(\d+)\s*л\.?с?/i, key: 'Мощность', transform: (v: string) => `${v} л.с.` },
    { regex: /коробка[^.]*?([а-яё\s]+?)(?=\.|,|$)/i, key: 'Коробка передач' },
    { regex: /кабин[аы][^.]*?([а-яё\s\d]+?)(?=\.|,|$)/i, key: 'Тип кабины' },
    { regex: /топлив[оа][^.]*?([а-яё\s]+?)(?=\.|,|$)/i, key: 'Вид топлива' },
    { regex: /цвет[^.]*?([а-яё\s]+?)(?=\.|,|$)/i, key: 'Цвет кузова' },
    { regex: /подвеск[аи][^.]*?([а-яё\s\-]+?)(?=\.|,|$)/i, key: 'Тип подвески' },
    { regex: /тормоз[аы][^.]*?([а-яё\s]+?)(?=\.|,|$)/i, key: 'Тормоза' },
    { regex: /колесная[^.]*?формула[^.]*?([\dx]+)/i, key: 'Колесная формула' },
  ];
  
  for (const pattern of descriptivePatterns) {
    const match = text.match(pattern.regex);
    if (match && !specs[pattern.key]) {
      let value = match[1].trim();
      if (pattern.transform) {
        value = pattern.transform(value);
      }
      specs[pattern.key] = value;
    }
  }
}

function extractTechnicalSpecs(specs: Record<string, string>, text: string) {
  // Автоматическое извлечение технических характеристик
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Пропускаем строки с общими фразами
    if (isGeneralInfoLine(line)) continue;
    
    // Извлечение характеристик с единицами измерения
    extractMeasurements(specs, line);
    
    // Извлечение булевых характеристик
    extractBooleanSpecs(specs, line);
    
    // Извлечение характеристик оборудования
    extractEquipmentSpecs(specs, line);
  }
}

function extractMeasurements(specs: Record<string, string>, line: string) {
  const measurementPatterns = [
    { regex: /(\d[\d\s]*)\s*км\b/, key: 'Пробег', suffix: ' км' },
    { regex: /(\d{4})\s*г\.?/, key: 'Год выпуска', suffix: '' },
    { regex: /(\d+)\s*л\.?с?\.?/, key: 'Мощность', suffix: ' л.с.' },
    { regex: /(\d+)\s*кг\b/, key: 'Масса', suffix: ' кг' },
    { regex: /(\d+)\s*т\b/, key: 'Грузоподъемность', suffix: ' т' },
    { regex: /(\d+)\s*л\b/, key: 'Объем', suffix: ' л' },
    { regex: /([\dx]+)\s*колесная/, key: 'Колесная формула', suffix: '' },
  ];
  
  for (const pattern of measurementPatterns) {
    const match = line.match(pattern.regex);
    if (match && !specs[pattern.key]) {
      const value = match[1].replace(/\s/g, '') + pattern.suffix;
      specs[pattern.key] = value;
    }
  }
}

function extractBooleanSpecs(specs: Record<string, string>, line: string) {
  const lowerLine = line.toLowerCase();
  
  const booleanSpecs = [
    { pattern: /кондиционер/, key: 'Кондиционер', value: 'Есть' },
    { pattern: /круиз-?контроль/, key: 'Круиз-контроль', value: 'Есть' },
    { pattern: /\bабс\b/, key: 'ABS', value: 'Есть' },
    { pattern: /подушки? безопасности/, key: 'Подушки безопасности', value: 'Есть' },
    { pattern: /гидроусилитель/, key: 'ГУР', value: 'Есть' },
    { pattern: /спальное место/, key: 'Спальное место', value: 'Есть' },
    { pattern: /диагностика пройдена/, key: 'Диагностика', value: 'Пройдена' },
  ];
  
  for (const spec of booleanSpecs) {
    if (spec.pattern.test(lowerLine) && !specs[spec.key]) {
      specs[spec.key] = spec.value;
    }
  }
}

function extractEquipmentSpecs(specs: Record<string, string>, line: string) {
  const equipmentKeywords = {
    'Тип кабины': ['кабина', 'местная', 'спальная'],
    'Вид топлива': ['дизель', 'бензин', 'газ', 'топливо'],
    'Коробка передач': ['автоматическая', 'механическая', 'робот', 'кпп'],
    'Тормоза': ['дисковые', 'барабанные', 'тормоз'],
    'Подвеска': ['пневмо', 'рессорная', 'подвеска'],
  };
  
  const lowerLine = line.toLowerCase();
  
  for (const [key, keywords] of Object.entries(equipmentKeywords)) {
    if (keywords.some(kw => lowerLine.includes(kw)) && !specs[key]) {
      // Пытаемся извлечь значение из контекста
      const contextMatch = line.match(new RegExp(`(${keywords.join('|')})[^.,]*?([^.,]+)`, 'i'));
      if (contextMatch && contextMatch[2]) {
        specs[key] = contextMatch[2].trim();
      } else if (!specs[key]) {
        // Если не нашли конкретное значение, ставим маркер
        specs[key] = 'Есть';
      }
    }
  }
}

function cleanSpecifications(specs: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  const seenKeys = new Set<string>();
  
  for (const [key, value] of Object.entries(specs)) {
    if (isValidSpecKey(key) && isValidSpecValue(value)) {
      const cleanKey = normalizeKey(key);
      const cleanValue = cleanValue(value);
      
      // Убираем дубликаты (нормализованные ключи)
      if (!seenKeys.has(cleanKey.toLowerCase())) {
        cleaned[cleanKey] = cleanValue;
        seenKeys.add(cleanKey.toLowerCase());
      }
    }
  }
  
  return cleaned;
}

function normalizeKey(key: string): string {
  return key
    .replace(/^[^a-zA-Zа-яА-Я]*/, '')
    .replace(/[^a-zA-Zа-яА-Я0-9\s]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanValue(value: string): string {
  return value
    .replace(/^[^a-zA-Zа-яА-Я0-9]*/, '')
    .replace(/[^a-zA-Zа-яА-Я0-9]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGeneralInfoLine(line: string): boolean {
  const generalPatterns = [
    /коммерческое предложение/i,
    /технические характеристики/i,
    /описание/i,
    /стоимость/i,
    /цена/i,
    /рублей?/i,
    /в наличии/i,
    /лизинг/i,
    /безналичн/i,
  ];
  
  return generalPatterns.some(pattern => pattern.test(line.toLowerCase()));
}

function isValidPrice(priceStr: string): boolean {
  if (!priceStr || priceStr === '1') return false;
  const price = parseInt(priceStr);
  return !isNaN(price) && price > 1000 && price < 1000000000;
}

function isValidSpecKey(key: string): boolean {
  if (!key || key.length < 2 || key.length > 50) return false;
  if (key.match(/^\d+$/)) return false;
  if (!key.match(/[а-яёa-z]/i)) return false;
  
  const invalidKeys = [
    'я', 'коммерческое', 'предложение', 'стоимость', 'цена',
    'руб', 'характеристики', 'техника', 'описание', 'в наличии'
  ];
  
  const lowerKey = key.toLowerCase();
  return !invalidKeys.some(invalid => lowerKey.includes(invalid));
}

function isValidSpecValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 100) return false;
  
  const invalidValues = [
    'я', 'характеристики', 'техники', 'коммерческое предложение',
    'стоимость', 'цена'
  ];
  
  const lowerValue = value.toLowerCase();
  return !invalidValues.some(invalid => lowerValue.includes(invalid));
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  // Сортируем характеристики для лучшего отображения
  const priorityKeys = [
    'Марка', 'Модель', 'Год выпуска', 'Пробег',
    'Двигатель', 'Мощность', 'Коробка передач',
    'Тип кабины', 'Колесная формула', 'Тип подвески'
  ];
  
  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([keyA], [keyB]) => {
      const indexA = priorityKeys.indexOf(keyA);
      const indexB = priorityKeys.indexOf(keyB);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return keyA.localeCompare(keyB);
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
