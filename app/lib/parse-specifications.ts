// Умный парсер для извлечения характеристик из сложного текста
export interface ParsedSpec {
  category: string;
  key: string;
  value: string;
  unit?: string;
  rawText: string;
}

// Словарь для исправления OCR-ошибок
const OCR_CORRECTIONS: Record<string, string> = {
  'пидавалика': 'гидравлика',
  'пидавалический': 'гидравлический',
  'колейка': 'модель',
  'держатель': 'двигатель',
  'шасси': 'шасси',
  'заделав часть': 'рабочая часть',
  'самбот': 'SAA6D',
  'садденс': 'SAA6D',
  'психотворность': 'мощность',
  'компакт-массу': 'рабочий объем',
  'аэрогенетичность': 'производительность',
  'д/мин': 'л/мин'
};

// Категории и их ключевые слова
const CATEGORY_PATTERNS: Record<string, string[]> = {
  'Двигатель': [
    'двигатель', 'модель', 'мощность', 'объем', 'цилиндр', 'топливо',
    'стандарт', 'саа6д', 'tier', 'stage', 'квт', 'л.с.'
  ],
  'Гидравлика': [
    'гидравлика', 'пидавалика', 'давление', 'расход', 'насос', 'мпа',
    'кг/см', 'л/мин', 'д/мин', 'система нагрузки'
  ],
  'Рабочие характеристики': [
    'скорость поворота', 'усилие копания', 'ковш', 'рукоять', 'об/мин',
    'кн', 'тонн', 'т'
  ],
  'Ходовые характеристики': [
    'скорость', 'тяговое усилие', 'подъем', 'км/ч', 'преодолеваемый'
  ],
  'Эксплуатационные параметры': [
    'бак', 'топливо', 'давление на грунт', 'температура', 'емкость',
    'кг/см²', 'литр', 'л'
  ],
  'Режимы работы': [
    'режим', 'экономичный', 'мощность', 'heavy lift', 'уровень'
  ]
};

export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  const specs: ParsedSpec[] = [];
  
  // Предварительная обработка текста
  const cleanedText = preprocessText(text);
  const lines = cleanedText.split('\n').filter(line => line.trim().length > 3);
  
  let currentCategory = 'Общие';
  const processedEntries = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Определяем категорию по заголовкам
    const detectedCategory = detectCategory(line);
    if (detectedCategory) {
      currentCategory = detectedCategory;
      continue;
    }
    
    // Парсим табличные данные и списки
    const tableMatch = line.match(/(.+?)\s*\|\s*(.+)/);
    if (tableMatch) {
      const [, key, value] = tableMatch;
      const spec = createSpec(currentCategory, key, value, line);
      if (spec && !processedEntries.has(spec.key)) {
        processedEntries.add(spec.key);
        specs.push(spec);
      }
      continue;
    }
    
    // Парсим данные в формате "Ключ: Значение"
    const colonMatch = line.match(/(.+?)[:\-]\s*(.+)/);
    if (colonMatch) {
      const [, key, value] = colonMatch;
      const spec = createSpec(currentCategory, key, value, line);
      if (spec && !processedEntries.has(spec.key)) {
        processedEntries.add(spec.key);
        specs.push(spec);
      }
      continue;
    }
    
    // Обрабатываем числовые значения с единицами измерения
    const valueMatch = line.match(/(\d+[.,]?\d*)\s*([а-яa-z²³%/°·¬≤≥±]+)/gi);
    if (valueMatch && i > 0) {
      // Пытаемся найти ключ в предыдущей строке
      const prevLine = lines[i-1].trim();
      if (!prevLine.match(/(\d+[.,]?\d*)/)) {
        const spec = createSpec(currentCategory, prevLine, line, line);
        if (spec && !processedEntries.has(spec.key)) {
          processedEntries.add(spec.key);
          specs.push(spec);
        }
      }
    }
  }

  return mergeDuplicateSpecs(specs);
}

function preprocessText(text: string): string {
  let cleaned = text;
  
  // Исправляем OCR-ошибки
  Object.entries(OCR_CORRECTIONS).forEach(([wrong, correct]) => {
    cleaned = cleaned.replace(new RegExp(wrong, 'gi'), correct);
  });
  
  // Удаляем лишние символы
  cleaned = cleaned.replace(/[«»"“”]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  
  return cleaned;
}

function detectCategory(line: string): string | null {
  const lowerLine = line.toLowerCase();
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(pattern => lowerLine.includes(pattern))) {
      return category;
    }
  }
  
  // Проверяем заголовки
  if (line.match(/^#{1,3}\s+.+/) || line.match(/^[А-Я][А-ЯА-Я\s]+\s*$/)) {
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      if (patterns.some(pattern => lowerLine.includes(pattern))) {
        return category;
      }
    }
  }
  
  return null;
}

function createSpec(category: string, key: string, value: string, rawText: string): ParsedSpec | null {
  const normalizedKey = normalizeKey(key);
  const { normalizedValue, unit } = normalizeValue(value);
  
  if (!isValidSpec(normalizedKey, normalizedValue)) {
    return null;
  }
  
  return {
    category,
    key: normalizedKey,
    value: normalizedValue,
    unit,
    rawText: rawText.trim()
  };
}

function normalizeKey(key: string): string {
  let normalized = key
    .trim()
    .replace(/[:\-]\s*$/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  
  // Исправляем распространенные ошибки
  const keyCorrections: Record<string, string> = {
    'пидавалика': 'Гидравлика',
    'пидавалический': 'Гидравлический',
    'тепловой бак': 'Топливный бак',
    'тяговое усилие': 'Тяговое усилие',
    'преодолеваемый подъем': 'Максимальный уклон',
    'усилие копания ковшом': 'Усилие копания (ковш)',
    'усилие копания рукоятью': 'Усилие копания (рукоять)'
  };
  
  Object.entries(keyCorrections).forEach(([wrong, correct]) => {
    if (normalized.includes(wrong)) {
      normalized = correct;
    }
  });
  
  // Капитализируем первую букву каждого слова
  return normalized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeValue(value: string): { normalizedValue: string; unit?: string } {
  let cleaned = value.trim();
  
  // Извлекаем единицы измерения
  const unitPatterns = [
    /([\d.,]+)\s*(кН|МПа|кг\/см²?|л\/мин|д\/мин|об\/мин|км\/ч|%|°?[СC]|л|кг|т|кВт)/gi,
    /([\d.,]+\s*-\s*[\d.,]+)\s*([а-яa-z\/²³%°]+)/gi
  ];
  
  let unit: string | undefined;
  let normalizedValue = cleaned;
  
  for (const pattern of unitPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const detailedMatch = cleaned.match(/([\d.,]+)\s*([а-яa-z\/²³%°·]+)/i);
      if (detailedMatch) {
        normalizedValue = detailedMatch[1].trim();
        unit = detailedMatch[2].trim();
        break;
      }
    }
  }
  
  // Исправляем значения
  normalizedValue = normalizedValue
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.')
    .replace(/\s*м³/g, ' м³')
    .replace(/\s*л\.с\./g, ' л.с.')
    .replace(/гсм2/g, 'кг/см²')
    .replace(/д\/мин/g, 'л/мин');
  
  return { normalizedValue, unit };
}

function isValidSpec(key: string, value: string): boolean {
  if (!key || !value) return false;
  if (key.length < 2 || key.length > 100) return false;
  if (value.length < 1 || value.length > 100) return false;
  
  // Исключаем общие слова
  const excludedKeys = ['год', 'страна', 'цвет', 'цена', 'стоимость', 'описание'];
  if (excludedKeys.some(excluded => key.toLowerCase().includes(excluded))) return false;
  
  // Должно содержать значимую информацию
  if (!/\d/.test(value) && value.length < 10) return false;
  
  return true;
}

function mergeDuplicateSpecs(specs: ParsedSpec[]): ParsedSpec[] {
  const merged: Record<string, ParsedSpec> = {};
  
  for (const spec of specs) {
    const key = `${spec.category}_${spec.key}`;
    
    if (!merged[key] || isBetterSpec(spec, merged[key])) {
      merged[key] = spec;
    }
  }
  
  return Object.values(merged).sort((a, b) => a.category.localeCompare(b.category));
}

function isBetterSpec(newSpec: ParsedSpec, existingSpec: ParsedSpec): boolean {
  // Предпочитаем спецификации с единицами измерения
  if (newSpec.unit && !existingSpec.unit) return true;
  // Предпочитаем более длинные (полные) значения
  if (newSpec.value.length > existingSpec.value.length) return true;
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

// Функция для тестирования с вашим текстом
export function testKomatsuParser() {
  const testText = `
# Характеристики

## Рабочие характеристики

| Скорость поворота    | 5,8 об/мин |
|---|---|
| Усилие копания ковшом    | 479 кН (48,8 т) |
| Усилие копания рукоятью    | 412 кН (42,0 т) |

## Пидавалика

| Расход    | 2 × 494 д/мин + 1 × 600 д/мин |
|---|---|
| Система    | Обнаружения нагрузки с открытым центром |
| Давление    | 314 МПа (320 кг/см²) |

## Ходовые характеристики

| Скорость    | 3,2 км/ч |
|---|---|
| Тяговое усилие    | 686 кН |
| Преодолеваемый подъем    | 70% |

## Двигатель

| Объем    | 23:15 л |
|---|---|
| Модель    | Komatsu SAMBOT/OE-3 |
| Мощность    | EPA Tier 3 / EU Stage 3A |
| Стандарт    | 6    |
  `;

  const specs = parseSpecificationsFromText(testText);
  const json = convertParsedToJSON(specs);
  
  console.log('Результат парсинга:');
  console.log(JSON.stringify(json, null, 2));
  
  return {
    specs,
    json,
    stats: {
      total: specs.length,
      categories: Object.keys(json)
    }
  };
}
