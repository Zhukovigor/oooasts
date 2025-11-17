// Улучшенный парсер для извлечения характеристик из текста
export interface ParsedSpec {
  category: string;
  key: string;
  value: string;
  unit?: string;
  rawText: string;
}

// Расширенные категории характеристик на русском
const SPEC_CATEGORIES: Record<string, string[]> = {
  "Двигатель": [
    "двигатель", "мощность", "производитель", "модель", "крутящий момент", "цилиндр", 
    "обороты", "топливо", "дизель", "rpm", "л.с.", "кВт", "н·м", "нм", "объем", "стандарт"
  ],
  "Размеры": [
    "длина", "ширина", "высота", "габарит", "размер", "клиренс", 
    "дорожный просвет", "масса", "вес", "мм", "см", "м", "кг"
  ],
  "Производительность": [
    "емкость", "ковш", "грузоподъемность", "объем", "глубина копания", 
    "дальность выгрузки", "вырывное усилие", "усилие копания", "м³", "м3", "литр", "л"
  ],
  "Гидравлическая система": [
    "гидравлика", "насос", "давление", "производительность насоса", "расход",
    "гидросистема", "бар", "л/мин", "гидравлический", "мпа", "кг/см"
  ],
  "Ходовые характеристики": [
    "ходовые", "скорость", "тяговое усилие", "подъем", "км/ч", "преодолеваемый"
  ],
  "Трансмиссия": [
    "коробка", "передача", "привод", "трансмиссия", "скорость", 
    "передач", "привод", "акпп", "мкпп"
  ],
  "Емкости": [
    "топливный бак", "бак", "емкость", "топливо", "масло", 
    "моторное масло", "охлаждение", "гидросистема", "литр", "л"
  ],
  "Режимы работы": [
    "режим", "экономичный", "повышенной мощности", "heavy lift", "уровень"
  ],
  "Общие": ["производитель", "модель", "назначение", "тип"]
};

export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  const specs: ParsedSpec[] = [];
  const lines = text.split("\n").filter(line => line.trim().length > 2);
  
  const processedKeys = new Set<string>();
  let currentCategory = "Общие";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем категорию по заголовкам
    const category = detectCategoryFromLine(line);
    if (category) {
      currentCategory = category;
      continue;
    }

    // Парсим табличные данные (формат "| Ключ | Значение |")
    const tableMatch = parseTableLine(line);
    if (tableMatch) {
      const { key, value } = tableMatch;
      const spec = createSpec(currentCategory, key, value, line);
      if (spec && !processedKeys.has(`${currentCategory}_${spec.key}`)) {
        processedKeys.add(`${currentCategory}_${spec.key}`);
        specs.push(spec);
      }
      continue;
    }

    // Парсим данные в формате "Ключ: Значение"
    const colonMatch = parseColonLine(line);
    if (colonMatch) {
      const { key, value } = colonMatch;
      const spec = createSpec(currentCategory, key, value, line);
      if (spec && !processedKeys.has(`${currentCategory}_${spec.key}`)) {
        processedKeys.add(`${currentCategory}_${spec.key}`);
        specs.push(spec);
      }
      continue;
    }

    // Парсим данные в формате "Ключ Значение Единица"
    const patternMatch = parsePatternLine(line);
    if (patternMatch) {
      const { key, value, unit } = patternMatch;
      const spec = createSpec(currentCategory, key, value, line, unit);
      if (spec && !processedKeys.has(`${currentCategory}_${spec.key}`)) {
        processedKeys.add(`${currentCategory}_${spec.key}`);
        specs.push(spec);
      }
    }
  }

  return mergeDuplicateSpecs(specs);
}

// Вспомогательные функции парсинга
function detectCategoryFromLine(line: string): string | null {
  const lowerLine = line.toLowerCase().replace(/[#=-\s]/g, ' ');
  
  for (const [category, keywords] of Object.entries(SPEC_CATEGORIES)) {
    if (keywords.some(keyword => 
      lowerLine.includes(keyword.toLowerCase()) && 
      line.length < 100 // Заголовки обычно короткие
    )) {
      return category;
    }
  }
  
  // Специфичные проверки для заголовков
  if (line.match(/^#{1,3}\s+[А-Я]/) || line.match(/^[А-Я][а-я]+\s+[а-я]*характеристики?/i)) {
    const withoutHashes = line.replace(/^#{1,3}\s+/, '');
    for (const [category, keywords] of Object.entries(SPEC_CATEGORIES)) {
      if (keywords.some(keyword => withoutHashes.toLowerCase().includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    return "Общие";
  }
  
  return null;
}

function parseTableLine(line: string): { key: string; value: string } | null {
  const tableMatch = line.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
  if (tableMatch) {
    const [, key, value] = tableMatch;
    if (key && value && !key.match(/^-+$/) && !value.match(/^-+$/)) {
      return {
        key: key.trim(),
        value: value.trim()
      };
    }
  }
  return null;
}

function parseColonLine(line: string): { key: string; value: string } | null {
  // Улучшен парсинг для формата "Ключ: Значение"
  const colonMatch = line.match(/^([^:]{3,80}?)\s*[:–-]\s*(.+)$/);
  if (colonMatch) {
    const [, key, value] = colonMatch;
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    
    // Исключаем случаи когда значение очень длинное (вероятно - это не пара ключ-значение)
    if (trimmedValue.length > 200) {
      return null;
    }
    
    return {
      key: trimmedKey,
      value: trimmedValue
    };
  }
  return null;
}

function parsePatternLine(line: string): { key: string; value: string; unit?: string } | null {
  // Паттерн для "Ключ Значение Единица"
  const pattern1 = /([А-Яа-яЁё][А-Яа-яЁё\s\-]{2,40}?)\s+([\d.,]+(?:\s*[\d.,]*)*)\s*([А-Яа-яЁёA-Za-z²³%/°·¬≤≥±]*)/g;
  // Паттерн для числовых значений с единицами
  const pattern2 = /(\d+[.,]?\d*)\s*([а-яa-z²³%/°·¬≤≥±]+\s*[а-яa-z²³%/°·¬≤≥±]*)/gi;
  
  let match;
  if ((match = pattern1.exec(line)) !== null) {
    const [, key, value, unit] = match;
    return { key: key.trim(), value: value.trim(), unit: unit?.trim() };
  }
  
  if ((match = pattern2.exec(line)) !== null) {
    const [, value, unit] = match;
    // Ищем ключ в начале строки
    const keyPart = line.substring(0, match.index).trim();
    if (keyPart && keyPart.length > 2) {
      return { key: keyPart, value: value.trim(), unit: unit.trim() };
    }
  }
  
  return null;
}

function createSpec(
  category: string, 
  key: string, 
  value: string, 
  rawText: string, 
  unit?: string
): ParsedSpec | null {
  const normalizedKey = normalizeKey(key);
  const normalizedValue = normalizeValue(value);
  
  if (!isValidSpec(normalizedKey, normalizedValue)) {
    return null;
  }
  
  // Определяем категорию на основе ключа, если не задана
  const finalCategory = category === "Общие" ? determineCategory(normalizedKey, normalizedValue, unit || "") : category;
  
  return {
    category: finalCategory,
    key: normalizedKey,
    value: normalizedValue,
    unit: unit || extractUnit(normalizedValue),
    rawText: rawText.trim()
  };
}

function extractUnit(value: string): string | undefined {
  const unitMatch = value.match(/([\d.,\s]+)\s*([а-яa-z²³%/°·¬≤≥±]+\s*[а-ya-z²³%/°·¬≤≥±]*)$/i);
  return unitMatch ? unitMatch[2].trim() : undefined;
}

function isValidSpec(key: string, value: string): boolean {
  if (!key || !value) return false;
  
  const minKeyLength = 2;
  const maxKeyLength = 60;
  
  if (key.length < minKeyLength || key.length > maxKeyLength) return false;
  
  // Проверяем, что значение содержит значимую информацию
  if (!/[\d]/.test(value) && value.length < 3) return false;
  
  // Исключаем слишком длинные значения (признак неправильного парсинга)
  if (value.length > 150) return false;
  
  // Исключаем общие слова и заголовки
  const excludedKeys = [
    'год', 'страна', 'цвет', 'цена', 'стоимость', 'характеристики',
    'технические', 'спецификации', '===', '---', '###', 'примечание',
    'описание', 'скачать', 'pdf'
  ];
  
  if (excludedKeys.some(excluded => key.toLowerCase().includes(excluded))) {
    return false;
  }
  
  return true;
}

function determineCategory(key: string, value: string, unit: string): string {
  const lowerKey = key.toLowerCase();
  const lowerUnit = unit.toLowerCase();

  // Проверяем по ключу
  for (const [category, keywords] of Object.entries(SPEC_CATEGORIES)) {
    if (keywords.some(keyword => lowerKey.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  // Проверяем по единицам измерения
  const unitCategories: Record<string, string> = {
    'квт': 'Двигатель',
    'л.с.': 'Двигатель', 
    'н·м': 'Двигатель',
    'нм': 'Двигатель',
    'мм': 'Размеры',
    'см': 'Размеры', 
    'м': 'Размеры',
    'кг': 'Размеры',
    'т': 'Размеры',
    'м³': 'Производительность',
    'м3': 'Производительность',
    'л': 'Емкости',
    'л/мин': 'Гидравлическая система',
    'д/мин': 'Гидравлическая система',
    'бар': 'Гидравлическая система',
    'мпа': 'Гидравлическая система',
    'кг/см': 'Гидравлическая система',
    'об/мин': 'Производительность',
    'км/ч': 'Ходовые характеристики',
    'кн': 'Производительность',
    '%': 'Ходовые характеристики'
  };

  for (const [unitPattern, category] of Object.entries(unitCategories)) {
    if (lowerUnit.includes(unitPattern)) {
      return category;
    }
  }

  return 'Общие';
}

function normalizeKey(key: string): string {
  const synonyms: Record<string, string> = {
    'емкость ковша': 'Объем ковша',
    'объем ковша': 'Объем ковша',
    'грузоподъемность': 'Грузоподъемность',
    'мощность': 'Мощность двигателя',
    'мощность двигателя': 'Мощность двигателя',
    'производитель': 'Производитель',
    'модель': 'Модель',
    'модель двигателя': 'Модель двигателя',
    'длина': 'Длина',
    'ширина': 'Ширина', 
    'высота': 'Высота',
    'масса': 'Рабочий вес',
    'вес': 'Рабочий вес',
    'рабочий вес': 'Рабочий вес',
    'топливный бак': 'Топливный бак',
    'объем': 'Объем',
    'тяговое усилие': 'Тяговое усилие',
    'преодолеваемый подъем': 'Максимальный уклон',
    'усилие копания ковшом': 'Усилие копания (ковш)',
    'усилие копания рукоятью': 'Усилие копания (рукоять)',
    'усилие копания ковша': 'Усилие копания ковша',
    'усилие копания': 'Усилие копания ковша',
    'скорость поворота': 'Скорость поворота',
    'скорость': 'Скорость',
    'расход': 'Расход гидросистемы',
    'давление': 'Давление в системе',
    'глубина копания': 'Макс. глубина копания',
    'максимальная глубина': 'Макс. глубина копания',
    'макс глубина': 'Макс. глубина копания',
    'радиус работ': 'Макс. радиус работ',
    'максимальный радиус': 'Макс. радиус работ',
    'макс радиус': 'Макс. радиус работ',
    'высота разгрузки': 'Макс. высота разгрузки',
    'максимальная высота': 'Макс. высота разгрузки'
  };

  const normalized = key
    .trim()
    .toLowerCase();
  
  // Применяем синонимы - ищем лучший матч
  let bestMatch = null;
  let bestMatchLength = 0;
  
  for (const [wrong, correct] of Object.entries(synonyms)) {
    if (normalized.includes(wrong) && wrong.length > bestMatchLength) {
      bestMatch = correct;
      bestMatchLength = wrong.length;
    }
  }
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // Если синонима не найдено, капитализируем первую букву каждого слова
  return normalized
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.')
    .replace(/\s*м³/g, ' м³')
    .replace(/\s*л\.с\./g, ' л.с.')
    .replace(/гсм2/g, 'кг/см²')
    .replace(/д\/мин/g, 'л/мин');
}

function mergeDuplicateSpecs(specs: ParsedSpec[]): ParsedSpec[] {
  const merged: Record<string, ParsedSpec> = {};
  
  for (const spec of specs) {
    const key = `${spec.category}_${spec.key}`;
    
    if (!merged[key] || isBetterSpec(spec, merged[key])) {
      merged[key] = spec;
    }
  }
  
  return Object.values(merged);
}

function isBetterSpec(newSpec: ParsedSpec, existingSpec: ParsedSpec): boolean {
  // Предпочитаем спецификации с единицами измерения
  if (newSpec.unit && !existingSpec.unit) return true;
  // Предпочитаем более полные значения
  if (newSpec.value.length > existingSpec.value.length) return true;
  // Предпочитаем значения из таблиц (обычно более структурированы)
  if (newSpec.rawText.includes('|') && !existingSpec.rawText.includes('|')) return true;
  return false;
}

export function convertParsedToJSON(specs: ParsedSpec[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const spec of specs) {
    if (!result[spec.category]) {
      result[spec.category] = {};
    }
    
    const displayValue = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
    result[spec.category][spec.key] = displayValue;
  }

  return result;
}

// Дополнительная функция для тестирования
export function testParser(text: string) {
  const specs = parseSpecificationsFromText(text);
  const json = convertParsedToJSON(specs);
  
  console.log('Найденные характеристики:');
  console.log(JSON.stringify(json, null, 2));
  
  return {
    specs,
    json,
    stats: {
      total: specs.length,
      byCategory: Object.groupBy(specs, spec => spec.category)
    }
  };
}
