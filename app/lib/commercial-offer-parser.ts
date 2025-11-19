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

// Только базовые паттерны для основных полей
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
  extractAllSpecifications(data, lines, text);

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
    data.equipment = equipmentMatch[0];
  }

  // Поиск заголовка в первых строках
  const firstLines = lines.slice(0, 5);
  
  for (const line of firstLines) {
    if (line.length > 5 && line.length < 100 && !containsOnlySpecials(line)) {
      data.title = line.trim();
      break;
    }
  }

  // Если не нашли заголовок, используем первую непустую строку
  if (!data.title && lines.length > 0) {
    data.title = lines[0].trim();
  }
}

function containsOnlySpecials(text: string): boolean {
  return /^[^a-zA-Zа-яА-Я0-9]+$/.test(text);
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

  // Альтернативные форматы цены
  if (!data.price) {
    const altPriceMatch = normalizedText.match(/([\d\s]+(?:\s?\d{3})*)\s*руб(?!.*пробег)/i);
    if (altPriceMatch) {
      const priceStr = altPriceMatch[1].replace(/\s/g, '');
      if (isValidPrice(priceStr)) {
        data.price = parseInt(priceStr);
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

function extractAllSpecifications(data: CommercialOfferData, lines: string[], originalText: string) {
  const specs: Record<string, string> = {};
  
  // 1. Извлечение из табличного формата
  extractTableSpecifications(specs, lines);
  
  // 2. Извлечение из пар ключ-значение
  extractKeyValueSpecifications(specs, lines);
  
  // 3. Извлечение из структурированного текста
  extractStructuredSpecifications(specs, originalText);
  
  // 4. Универсальное извлечение из всех строк
  extractUniversalSpecifications(specs, lines);
  
  data.specifications = cleanSpecifications(specs);
}

function extractTableSpecifications(specs: Record<string, string>, lines: string[]) {
  for (const line of lines) {
    // Различные разделители таблицы
    const separators = ['\t', '|', '  ', ' - ', ' — '];
    
    for (const separator of separators) {
      if (line.includes(separator)) {
        const parts = line.split(separator).map(part => part.trim()).filter(part => part);
        
        // Обработка всех возможных пар
        for (let i = 0; i < parts.length - 1; i++) {
          const key = parts[i];
          const value = parts[i + 1];
          
          if (isValidSpecKey(key) && isValidSpecValue(value)) {
            // Нормализуем ключ (убираем лишние символы)
            const cleanKey = normalizeKey(key);
            if (!specs[cleanKey]) {
              specs[cleanKey] = value;
            }
          }
        }
      }
    }
  }
}

function extractKeyValueSpecifications(specs: Record<string, string>, lines: string[]) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Пытаемся найти пару ключ:значение в одной строке
    const singleLineMatch = extractKeyValueFromLine(line);
    if (singleLineMatch) {
      const cleanKey = normalizeKey(singleLineMatch.key);
      if (!specs[cleanKey]) {
        specs[cleanKey] = singleLineMatch.value;
      }
      continue;
    }
    
    // Пытаемся найти пару из двух строк (ключ на одной, значение на следующей)
    if (i < lines.length - 1) {
      const potentialKey = line;
      const potentialValue = lines[i + 1];
      
      if (isValidSpecKey(potentialKey) && isValidSpecValue(potentialValue)) {
        const cleanKey = normalizeKey(potentialKey);
        if (!specs[cleanKey]) {
          specs[cleanKey] = potentialValue;
          i++; // Пропускаем следующую строку
        }
      }
    }
  }
}

function extractKeyValueFromLine(line: string): { key: string; value: string } | null {
  const separators = [':', ' - ', ' — ', ' • '];
  
  for (const separator of separators) {
    const index = line.indexOf(separator);
    if (index > 0) {
      const key = line.substring(0, index).trim();
      const value = line.substring(index + separator.length).trim();
      
      if (isValidSpecKey(key) && isValidSpecValue(value)) {
        return { key, value };
      }
    }
  }
  
  return null;
}

function extractStructuredSpecifications(specs: Record<string, string>, text: string) {
  // Ищем паттерны типа "Характеристика: значение" по всему тексту
  const keyValueRegex = /([^:\n]+?)\s*[:]\s*([^\n]+)/g;
  let match;
  
  while ((match = keyValueRegex.exec(text)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    
    if (isValidSpecKey(key) && isValidSpecValue(value)) {
      const cleanKey = normalizeKey(key);
      if (!specs[cleanKey]) {
        specs[cleanKey] = value;
      }
    }
  }
}

function extractUniversalSpecifications(specs: Record<string, string>, lines: string[]) {
  // Обрабатываем каждую строку как потенциальную характеристику
  for (const line of lines) {
    // Пропускаем строки, которые явно не являются характеристиками
    if (isGeneralInfoLine(line)) continue;
    
    // Пытаемся разбить строку на части и найти характеристики
    const words = line.split(/\s+/).filter(word => word.length > 1);
    
    if (words.length >= 2) {
      // Пытаемся найти в строке числовые значения с единицами измерения
      extractMeasurements(specs, line);
      
      // Пытаемся найти булевые характеристики
      extractBooleanSpecs(specs, line);
    }
  }
}

function extractMeasurements(specs: Record<string, string>, line: string) {
  // Паттерны для числовых характеристик с единицами измерения
  const measurementPatterns = [
    { regex: /(\d+(?:\s?\d{3})*)\s*(?:км|km)/, key: 'Пробег', suffix: ' км' },
    { regex: /(\d{4})\s*(?:г\.?|год)/, key: 'Год выпуска', suffix: '' },
    { regex: /(\d+)\s*(?:л\.?с?\.?| horsepower)/, key: 'Мощность', suffix: ' л.с.' },
    { regex: /(\d+)\s*(?:кг|kg)/, key: 'Масса', suffix: ' кг' },
    { regex: /(\d+)\s*(?:т|ton)/, key: 'Грузоподъемность', suffix: ' т' },
    { regex: /(\d+)\s*(?:л|liter)/, key: 'Объем', suffix: ' л' },
    { regex: /(\d+)\s*(?:квт|kw)/, key: 'Мощность', suffix: ' кВт' },
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
    { pattern: /кондиционер|climate control/, key: 'Кондиционер', value: 'Есть' },
    { pattern: /круиз-?контроль|cruise control/, key: 'Круиз-контроль', value: 'Есть' },
    { pattern: /абс|abs/, key: 'ABS', value: 'Есть' },
    { pattern: /подушки? безопасности|airbag/, key: 'Подушки безопасности', value: 'Есть' },
    { pattern: /гидроусилитель|power steering/, key: 'ГУР', value: 'Есть' },
    { pattern: /спальное место|sleeper/, key: 'Спальное место', value: 'Есть' },
  ];
  
  for (const spec of booleanSpecs) {
    if (spec.pattern.test(lowerLine) && !specs[spec.key]) {
      specs[spec.key] = spec.value;
    }
  }
}

function normalizeKey(key: string): string {
  return key
    .replace(/^[^a-zA-Zа-яА-Я]*/, '') // Убираем спецсимволы в начале
    .replace(/[^a-zA-Zа-яА-Я0-9\s]$/, '') // Убираем спецсимволы в конце
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanSpecifications(specs: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  const seenKeys = new Set<string>();
  
  for (const [key, value] of Object.entries(specs)) {
    if (isValidSpecKey(key) && isValidSpecValue(value)) {
      const cleanKey = normalizeKey(key);
      const cleanValue = value.trim();
      
      // Убираем дубликаты (нормализованные ключи)
      if (!seenKeys.has(cleanKey.toLowerCase())) {
        cleaned[cleanKey] = cleanValue;
        seenKeys.add(cleanKey.toLowerCase());
      }
    }
  }
  
  return cleaned;
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
  if (key.match(/^\d+$/)) return false; // Только цифры
  if (!key.match(/[а-яёa-z]/i)) return false; // Должны быть буквы
  
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

export function formatSpecsForTable(specs: Record<string, string>): Array<Array<[string, string]>> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  // Просто преобразуем все спецификации в строки таблицы
  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim());

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
