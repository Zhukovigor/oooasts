// Обычный парсер для извлечения характеристик из текста
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
    "мощность", "производитель", "модель", "крутящий момент", "цилиндр", 
    "обороты", "топливо", "дизель", "rpm", "л.с.", "кВт", "н·м", "нм"
  ],
  "Размеры": [
    "длина", "ширина", "высота", "габарит", "размер", "клиренс", 
    "дорожный просвет", "масса", "вес", "мм", "см", "м", "кг"
  ],
  "Производительность": [
    "емкость", "ковш", "грузоподъемность", "объем", "глубина копания", 
    "дальность выгрузки", "вырывное усилие", "м³", "м3", "литр", "л"
  ],
  "Гидравлическая система": [
    "гидравлика", "насос", "давление", "производительность насоса", 
    "гидросистема", "бар", "л/мин", "гидравлический"
  ],
  "Трансмиссия": [
    "коробка", "передача", "привод", "трансмиссия", "скорость", 
    "передач", "привод", "акпп", "мкпп"
  ],
  "Емкости": [
    "топливный бак", "бак", "емкость", "топливо", "масло", 
    "моторное масло", "охлаждение", "гидросистема", "литр", "л"
  ],
  "Общие": ["производитель", "модель", "назначение", "тип"]
};

// Более точные регулярные выражения
const SPEC_PATTERNS = [
  // Паттерн для "Ключ: Значение Единица"
  /([А-Яа-яЁё][А-Яа-яЁё\s\-]*?)\s*[:\-]\s*([\d.,]+(?:\s*[\d.,]*)*)\s*([А-Яа-яЁёA-Za-z²³%/°·]*)/g,
  
  // Паттерн для "Значение Единица Ключ" 
  /([\d.,]+(?:\s*[\d.,]*)*)\s*([А-Яа-яЁёA-Za-z²³%/°·]*)\s*([А-Яа-яЁё][А-Яа-яЁё\s\-]*)/g,
  
  // Паттерн для составных числовых значений
  /(\d+(?:[.,]\d+)?)\s*(мм|см|м|кг|т|л|м³|м3|кВт|л\.с\.|л\/мин|бар|н·м|нм)/gi
];

export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  const specs: ParsedSpec[] = [];
  const lines = text.split("\n").filter(line => line.trim().length > 3);
  
  const processedKeys = new Set<string>();

  for (const line of lines) {
    if (line.trim().length < 4) continue;

    // Пропускаем заголовки и слишком короткие строки
    if (isHeaderLine(line)) continue;

    for (const pattern of SPEC_PATTERNS) {
      const matches = [...line.matchAll(pattern)];
      
      for (const match of matches) {
        let key = '', value = '', unit = '';

        if (pattern === SPEC_PATTERNS[0]) {
          // "Ключ: Значение Единица"
          key = match[1].trim();
          value = match[2].trim();
          unit = match[3].trim();
        } else if (pattern === SPEC_PATTERNS[1]) {
          // "Значение Единица Ключ"
          value = match[1].trim();
          unit = match[2].trim();
          key = match[3].trim();
        } else {
          // Числовые значения с единицами
          value = match[1].trim();
          unit = match[2].trim();
          key = extractKeyFromContext(line, value, unit);
        }

        if (isValidSpec(key, value)) {
          const normalizedKey = normalizeKey(key);
          const specId = `${normalizedKey}_${value}_${unit}`;
          
          if (!processedKeys.has(specId)) {
            processedKeys.add(specId);
            
            const category = determineCategory(normalizedKey, value, unit);
            
            specs.push({
              category,
              key: normalizedKey,
              value: normalizeValue(value),
              unit: unit || undefined,
              rawText: line.trim()
            });
          }
        }
      }
    }
  }

  return mergeDuplicateSpecs(specs);
}

// Вспомогательные функции
function isHeaderLine(line: string): boolean {
  const headerIndicators = ['характеристики', 'технические', 'спецификации', '===', '---', '###'];
  const lowerLine = line.toLowerCase();
  return headerIndicators.some(indicator => lowerLine.includes(indicator));
}

function isValidSpec(key: string, value: string): boolean {
  if (!key || !value) return false;
  
  const minKeyLength = 2;
  const maxKeyLength = 50;
  
  // Проверяем, что ключ не слишком короткий и не слишком длинный
  if (key.length < minKeyLength || key.length > maxKeyLength) return false;
  
  // Проверяем, что значение содержит числа
  if (!/\d/.test(value)) return false;
  
  // Исключаем общие слова, которые не являются характеристиками
  const excludedKeys = ['год', 'страна', 'цвет', 'цена', 'стоимость'];
  if (excludedKeys.some(excluded => key.toLowerCase().includes(excluded))) return false;
  
  return true;
}

function extractKeyFromContext(line: string, value: string, unit: string): string {
  // Удаляем найденное значение и единицу из строки, оставшийся текст - ключ
  let key = line.replace(value, '').replace(unit, '').trim();
  
  // Очищаем ключ от лишних символов
  key = key.replace(/[:\-\–\—]\s*$/, '').trim();
  
  return key || 'Неизвестный параметр';
}

function determineCategory(key: string, value: string, unit: string): string {
  const lowerKey = key.toLowerCase();
  const lowerValue = value.toLowerCase();
  const lowerUnit = unit.toLowerCase();

  // Проверяем по ключу
  for (const [category, keywords] of Object.entries(SPEC_CATEGORIES)) {
    if (keywords.some(keyword => lowerKey.includes(keyword))) {
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
    'м³': 'Производительность',
    'м3': 'Производительность',
    'л': 'Емкости',
    'л/мин': 'Гидравлическая система',
    'бар': 'Гидравлическая система'
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
    'грузоподъемность': 'Грузоподъемность',
    'мощность': 'Мощность',
    'производитель': 'Производитель',
    'модель': 'Модель',
    'длина': 'Длина',
    'ширина': 'Ширина', 
    'высота': 'Высота',
    'масса': 'Масса',
    'вес': 'Масса',
    'топливный бак': 'Топливный бак',
    'объем': 'Объем'
  };

  const normalized = key
    .trim()
    .toLowerCase()
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return synonyms[normalized.toLowerCase()] || normalized;
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.')
    .replace(/\s*м³/g, ' м³')
    .replace(/\s*л\.с\./g, ' л.с.');
}

function mergeDuplicateSpecs(specs: ParsedSpec[]): ParsedSpec[] {
  const merged: Record<string, ParsedSpec> = {};
  
  for (const spec of specs) {
    const key = `${spec.category}_${spec.key}`;
    
    if (!merged[key] || merged[key].rawText.length < spec.rawText.length) {
      merged[key] = spec;
    }
  }
  
  return Object.values(merged);
}

export function convertParsedToJSON(specs: ParsedSpec[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};

  for (const spec of specs) {
    if (!result[spec.category]) {
      result[spec.category] = {};
    }
    
    const valueWithUnit = spec.unit ? `${spec.value} ${spec.unit}` : spec.value;
    result[spec.category][spec.key] = valueWithUnit;
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
