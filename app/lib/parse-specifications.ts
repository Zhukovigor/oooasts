// Улучшенный парсер для извлечения характеристик из текста с AI-компонентом
export interface ParsedSpec {
  category: string;
  key: string;
  value: string;
  unit?: string;
  rawText: string;
  confidence?: number; // Уверенность в правильности извлечения (0-1)
}

// Конфигурация парсера для гибкой настройки
interface ParserConfig {
  strictMode: boolean;
  autoCategorize: boolean;
  mergeSimilar: boolean;
  maxValueLength: number;
  useAI: boolean; // Использовать AI для сложных случаев
  minConfidence: number; // Минимальная уверенность для AI-результатов
}

const defaultConfig: ParserConfig = {
  strictMode: false,
  autoCategorize: true,
  mergeSimilar: true,
  maxValueLength: 150,
  useAI: false,
  minConfidence: 0.6
};

// Расширенные категории характеристик на русском
const SPEC_CATEGORIES: Record<string, string[]> = {
  "Двигатель": [
    "двигатель", "мощность", "производитель", "модель", "крутящий момент", "цилиндр", 
    "обороты", "топливо", "дизель", "rpm", "л.с.", "кВт", "н·м", "нм", "объем", "стандарт",
    "мощность двигателя", "модель двигателя", "nominal power", "rated power"
  ],
  "Размеры": [
    "длина", "ширина", "высота", "габарит", "размер", "клиренс", 
    "дорожный просвет", "масса", "вес", "мм", "см", "м", "кг", "тонн",
    "рабочий вес", "эксплуатационная масса", "length", "width", "height", "weight"
  ],
  "Производительность": [
    "емкость", "ковш", "грузоподъемность", "объем", "глубина копания", 
    "дальность выгрузки", "вырывное усилие", "усилие копания", "м³", "м3", "литр", "л",
    "макс. глубина", "максимальная глубина", "радиус", "высота разгрузки",
    "bucket capacity", "digging depth", "reach", "dump height"
  ],
  "Гидравлическая система": [
    "гидравлика", "насос", "давление", "производительность насоса", "расход",
    "гидросистема", "бар", "л/мин", "гидравлический", "мпа", "кг/см", "давление в системе",
    "hydraulic", "pressure", "flow", "pump"
  ],
  "Ходовые характеристики": [
    "ходовые", "скорость", "тяговое усилие", "подъем", "км/ч", "преодолеваемый",
    "транспортная скорость", "speed", "travel speed"
  ],
  "Трансмиссия": [
    "коробка", "передача", "привод", "трансмиссия", "скорость", 
    "передач", "привод", "акпп", "мкпп", "transmission", "gear"
  ],
  "Емкости": [
    "топливный бак", "бак", "емкость", "топливо", "масло", 
    "моторное масло", "охлаждение", "гидросистема", "литр", "л",
    "fuel tank", "coolant", "hydraulic oil"
  ],
  "Режимы работы": [
    "режим", "экономичный", "повышенной мощности", "heavy lift", "уровень",
    "work mode", "power mode", "eco mode"
  ],
  "Общие": ["производитель", "модель", "назначение", "тип", "manufacturer", "model", "type"]
};

// Словарь синонимов для нормализации ключей
const KEY_SYNONYMS: Record<string, string> = {
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
  'эксплуатационная масса': 'Рабочий вес',
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
  'максимальная высота': 'Макс. высота разгрузки',
  'bucket capacity': 'Объем ковша',
  'digging depth': 'Макс. глубина копания',
  'operating weight': 'Рабочий вес',
  'engine power': 'Мощность двигателя'
};

// Словарь для исправления OCR-ошибок и опечаток
const OCR_CORRECTIONS: Record<string, string> = {
  'предварительная система': 'гидравлическая система',
  'производительность насосов': 'производительность насоса',
  'блокиры': 'емкости',
  'техническая база': 'топливный бак',
  'напряжение насоса': 'моторное масло',
  'система пользователя': 'система охлаждения',
  'следопоставляя': 'гидросистема',
  'диапазон': 'давление',
  'денъги гла': 'неизвестный параметр',
  'иссоны прокладетам': 'неизвестное значение'
};

/**
 * Основная функция парсинга характеристик из текста
 */
export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  return parseSpecificationsFromTextAdvanced(text);
}

/**
 * Улучшенная функция парсинга с конфигурацией
 */
export function parseSpecificationsFromTextAdvanced(
  text: string, 
  config: Partial<ParserConfig> = {}
): ParsedSpec[] {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Используем AI-парсер для сложных случаев
  if (finalConfig.useAI) {
    return parseWithAI(text, finalConfig);
  }
  
  // Используем стандартный парсер
  return parseWithStandard(text, finalConfig);
}

/**
 * Парсинг с использованием AI для сложных случаев
 */
function parseWithAI(text: string, config: ParserConfig): ParsedSpec[] {
  const specs: ParsedSpec[] = [];
  const lines = text.split("\n").filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 2 && 
           !trimmed.startsWith('#') && 
           !trimmed.startsWith('---') &&
           !trimmed.startsWith('|') &&
           !trimmed.includes('Примечание');
  });
  
  const processedKeys = new Set<string>();
  let currentCategory = "Общие";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем пустые строки и разделители
    if (isSeparatorLine(line)) continue;
    
    // Исправляем OCR-ошибки
    const correctedLine = correctOCRerrors(line);
    
    // Определяем категорию по заголовкам
    const category = detectCategoryFromLine(correctedLine);
    if (category) {
      currentCategory = category;
      continue;
    }

    // Парсим с AI-подходом
    const parsedSpec = parseLineWithAI(correctedLine, currentCategory, config);
    if (parsedSpec && !processedKeys.has(`${currentCategory}_${parsedSpec.key}`)) {
      processedKeys.add(`${currentCategory}_${parsedSpec.key}`);
      
      // Фильтруем по уверенности
      if (parsedSpec.confidence && parsedSpec.confidence >= config.minConfidence) {
        specs.push(parsedSpec);
      } else if (!parsedSpec.confidence) {
        specs.push(parsedSpec);
      }
    }
  }

  const mergedSpecs = config.mergeSimilar ? 
    mergeSimilarSpecs(specs) : 
    mergeDuplicateSpecs(specs);

  return mergedSpecs;
}

/**
 * Стандартный парсинг
 */
function parseWithStandard(text: string, config: ParserConfig): ParsedSpec[] {
  const specs: ParsedSpec[] = [];
  const lines = text.split("\n").filter(line => line.trim().length > 2);
  
  const processedKeys = new Set<string>();
  let currentCategory = "Общие";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Пропускаем пустые строки и разделители
    if (isSeparatorLine(line)) continue;
    
    // Определяем категорию по заголовкам
    const category = detectCategoryFromLine(line);
    if (category) {
      currentCategory = category;
      continue;
    }

    // Парсим различные форматы данных
    const parsedSpec = parseLineFormats(line, currentCategory, config);
    if (parsedSpec && !processedKeys.has(`${currentCategory}_${parsedSpec.key}`)) {
      processedKeys.add(`${currentCategory}_${parsedSpec.key}`);
      specs.push(parsedSpec);
    }
  }

  const mergedSpecs = config.mergeSimilar ? 
    mergeSimilarSpecs(specs) : 
    mergeDuplicateSpecs(specs);

  return mergedSpecs;
}

/**
 * Исправление OCR-ошибок
 */
function correctOCRerrors(text: string): string {
  let corrected = text.toLowerCase();
  
  // Применяем исправления из словаря
  Object.entries(OCR_CORRECTIONS).forEach(([wrong, correct]) => {
    if (corrected.includes(wrong)) {
      corrected = corrected.replace(wrong, correct);
    }
  });

  return corrected;
}

/**
 * AI-парсинг строки
 */
function parseLineWithAI(
  line: string, 
  currentCategory: string, 
  config: ParserConfig
): ParsedSpec | null {
  // Пробуем разные стратегии парсинга с оценкой уверенности
  const strategies = [
    { parser: parseColonFormat, weight: 1.0 },
    { parser: parseKeyValueFormat, weight: 0.9 },
    { parser: parseNumericFormat, weight: 0.8 },
    { parser: parseSimpleFormat, weight: 0.6 }
  ];

  let bestResult: ParsedSpec | null = null;
  let bestConfidence = 0;

  for (const { parser, weight } of strategies) {
    const result = parser(line, currentCategory);
    if (result) {
      const confidence = (result.confidence || 0.5) * weight;
      if (confidence > bestConfidence) {
        bestResult = { ...result, confidence };
        bestConfidence = confidence;
      }
    }
  }

  return bestResult;
}

/**
 * Парсинг формата "Ключ: Значение" с оценкой уверенности
 */
function parseColonFormat(line: string, category: string): ParsedSpec | null {
  const match = line.match(/^([^:]{3,50}?)\s*[:]\s*(.+)$/i);
  if (!match) return null;

  const [, rawKey, rawValue] = match;
  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(rawKey.trim());
  const { value, unit, confidence: valueConfidence } = parseValueWithConfidence(rawValue.trim());

  const overallConfidence = (keyConfidence + valueConfidence) / 2;

  if (isValidSpec(key, value, { maxValueLength: 150 })) {
    return {
      category,
      key,
      value,
      unit,
      rawText: line,
      confidence: overallConfidence
    };
  }

  return null;
}

/**
 * Парсинг ключ-значение без явного разделителя
 */
function parseKeyValueFormat(line: string, category: string): ParsedSpec | null {
  const match = line.match(/^([а-яa-z\s]{3,40}?)\s+([\d.,]+)\s*([а-яa-z\/²³%°]*)$/i);
  if (!match) return null;

  const [, rawKey, rawValue, rawUnit] = match;
  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(rawKey.trim());
  const { value, unit, confidence: valueConfidence } = parseValueWithConfidence(rawValue.trim(), rawUnit.trim());

  const overallConfidence = (keyConfidence + valueConfidence) / 2;

  if (isValidSpec(key, value, { maxValueLength: 150 })) {
    return {
      category,
      key,
      value,
      unit,
      rawText: line,
      confidence: overallConfidence
    };
  }

  return null;
}

/**
 * Парсинг числовых форматов
 */
function parseNumericFormat(line: string, category: string): ParsedSpec | null {
  const match = line.match(/([\d.,]+)\s*([а-яa-z\/²³%°]+)/gi);
  if (!match) return null;

  const numericPart = match[0];
  const keyPart = line.replace(numericPart, '').trim();

  if (keyPart.length < 2 || keyPart.length > 50) return null;

  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(keyPart);
  const valueMatch = numericPart.match(/([\d.,]+)\s*([а-яa-z\/²³%°]*)/i);
  
  if (!valueMatch) return null;

  const [, value, unit] = valueMatch;
  const { value: normalizedValue, confidence: valueConfidence } = parseValueWithConfidence(value, unit);

  const overallConfidence = (keyConfidence + valueConfidence) / 2 * 0.8;

  if (isValidSpec(key, normalizedValue, { maxValueLength: 150 })) {
    return {
      category,
      key,
      value: normalizedValue,
      unit,
      rawText: line,
      confidence: overallConfidence
    };
  }

  return null;
}

/**
 * Простой парсинг для сложных случаев
 */
function parseSimpleFormat(line: string, category: string): ParsedSpec | null {
  const words = line.trim().split(/\s+/);
  if (words.length < 2) return null;

  // Пытаемся найти числовое значение
  let valueIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (words[i].match(/[\d.,]/) && !words[i].match(/[а-яa-z]/i)) {
      valueIndex = i;
      break;
    }
  }

  if (valueIndex === -1) return null;

  const keyWords = words.slice(0, valueIndex).join(' ');
  const valueWords = words.slice(valueIndex).join(' ');

  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(keyWords);
  const { value, unit, confidence: valueConfidence } = parseValueWithConfidence(valueWords);

  const overallConfidence = (keyConfidence + valueConfidence) / 2 * 0.6;

  if (isValidSpec(key, value, { maxValueLength: 150 })) {
    return {
      category,
      key,
      value,
      unit,
      rawText: line,
      confidence: overallConfidence
    };
  }

  return null;
}

/**
 * Нормализация ключа с оценкой уверенности
 */
function normalizeKeyWithConfidence(rawKey: string): { key: string; confidence: number } {
  const normalized = rawKey.trim().toLowerCase();
  
  // Применяем синонимы - ищем лучший матч
  let bestMatch = null;
  let bestMatchLength = 0;
  let bestConfidence = 0.3; // Базовая уверенность
  
  for (const [wrong, correct] of Object.entries(KEY_SYNONYMS)) {
    if (normalized.includes(wrong.toLowerCase()) && wrong.length > bestMatchLength) {
      bestMatch = correct;
      bestMatchLength = wrong.length;
      bestConfidence = 0.9; // Высокая уверенность для известных ключей
    }
  }
  
  if (bestMatch) {
    return { key: bestMatch, confidence: bestConfidence };
  }
  
  // Если синонима не найдено, капитализируем первую букву каждого слова
  const formattedKey = normalized
    .split(/[\s\-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return { key: formattedKey, confidence: 0.3 };
}

/**
 * Парсинг значения с оценкой уверенности
 */
function parseValueWithConfidence(rawValue: string, rawUnit: string = ''): { 
  value: string; 
  unit?: string; 
  confidence: number 
} {
  // Извлекаем число из значения
  const numberMatch = rawValue.match(/^([\d.,]+)/);
  if (!numberMatch) {
    return { value: rawValue, confidence: 0.1 };
  }

  const numberStr = numberMatch[1].replace(',', '.');
  const numberValue = parseFloat(numberStr);

  if (isNaN(numberValue)) {
    return { value: rawValue, confidence: 0.1 };
  }

  // Определяем единицу измерения
  let unit = rawUnit;
  if (!unit) {
    const unitMatch = rawValue.replace(numberStr, '').trim();
    if (unitMatch) {
      unit = normalizeUnit(unitMatch);
    }
  } else {
    unit = normalizeUnit(unit);
  }

  // Проверяем правдоподобность значения
  let confidence = 0.7; // Базовая уверенность для числовых значений

  // Повышаем уверенность для правдоподобных значений
  if (unit === 'л/мин' && numberValue > 10 && numberValue < 1000) confidence += 0.2;
  if (unit === 'бар' && numberValue > 10 && numberValue < 500) confidence += 0.2;
  if (unit === 'л' && numberValue > 1 && numberValue < 1000) confidence += 0.2;

  return {
    value: numberValue.toString(),
    unit,
    confidence: Math.min(confidence, 0.95)
  };
}

/**
 * Нормализация единиц измерения
 */
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'л/мин': 'л/мин',
    'л': 'л',
    'бар': 'бар',
    'литр': 'л',
    'литров': 'л',
    'литры': 'л',
    'l/min': 'л/мин',
    'l': 'л',
    'bar': 'бар'
  };

  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || unit;
}

// Остальные функции остаются без изменений...

/**
 * Парсинг различных форматов строк
 */
function parseLineFormats(
  line: string, 
  currentCategory: string, 
  config: ParserConfig
): ParsedSpec | null {
  // Приоритет парсинга: таблица > двоеточие > паттерн
  
  // 1. Табличный формат
  const tableMatch = parseTableLine(line);
  if (tableMatch) {
    return createSpec(currentCategory, tableMatch.key, tableMatch.value, line, '', config);
  }

  // 2. Формат с разделителем (: - –)
  const colonMatch = parseColonLine(line);
  if (colonMatch) {
    return createSpec(currentCategory, colonMatch.key, colonMatch.value, line, '', config);
  }

  // 3. Паттерн с единицами измерения
  const patternMatch = parsePatternLine(line);
  if (patternMatch) {
    return createSpec(
      currentCategory, 
      patternMatch.key, 
      patternMatch.value, 
      line, 
      patternMatch.unit, 
      config
    );
  }

  return null;
}

/**
 * Определить категорию по строке
 */
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

/**
 * Парсинг табличных данных
 */
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

/**
 * Парсинг формата с разделителем
 */
function parseColonLine(line: string): { key: string; value: string } | null {
  const colonMatch = line.match(/^([^:]{3,80}?)\s*[:–-]\s*(.+)$/);
  if (colonMatch) {
    const [, key, value] = colonMatch;
    const trimmedKey = key.trim();
    const trimmedValue = value.trim();
    
    // Исключаем случаи когда значение очень длинное
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

/**
 * Парсинг паттернов с единицами измерения
 */
function parsePatternLine(line: string): { key: string; value: string; unit?: string } | null {
  // Паттерн для "Ключ Значение Единица"
  const pattern1 = /([А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-z\s\-]{2,40}?)\s+([\d.,]+(?:\s*[\d.,]*)*)\s*([А-Яа-яЁёA-Za-z²³%/°·¬≤≥±]*)/g;
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

/**
 * Создание спецификации
 */
function createSpec(
  category: string, 
  key: string, 
  value: string, 
  rawText: string, 
  unit?: string,
  config?: ParserConfig
): ParsedSpec | null {
  const normalizedKey = normalizeKey(key);
  const normalizedValue = normalizeValue(value);
  
  if (!isValidSpec(normalizedKey, normalizedValue, config)) {
    return null;
  }
  
  // Определяем категорию на основе ключа, если включена авто-категоризация
  const finalCategory = (config?.autoCategorize && category === "Общие") ? 
    determineCategory(normalizedKey, normalizedValue, unit || "") : 
    category;
  
  return {
    category: finalCategory,
    key: normalizedKey,
    value: normalizedValue,
    unit: unit || extractUnit(normalizedValue),
    rawText: rawText.trim()
  };
}

/**
 * Проверка валидности спецификации
 */
function isValidSpec(key: string, value: string, config?: ParserConfig): boolean {
  if (!key || !value) return false;
  
  const minKeyLength = 2;
  const maxKeyLength = 60;
  
  if (key.length < minKeyLength || key.length > maxKeyLength) return false;
  
  // В строгом режиме требуем числовые значения
  if (config?.strictMode && !/[\d]/.test(value)) return false;
  
  // В нестрогом режиме допускаем текстовые значения достаточной длины
  if (!config?.strictMode && !/[\d]/.test(value) && value.length < 3) return false;
  
  // Проверяем максимальную длину значения
  if (value.length > (config?.maxValueLength || 150)) return false;
  
  // Исключаем общие слова и заголовки
  const excludedKeys = [
    'год', 'страна', 'цвет', 'цена', 'стоимость', 'характеристики',
    'технические', 'спецификации', '===', '---', '###', 'примечание',
    'описание', 'скачать', 'pdf', 'рисунок', 'таблица', 'изображение'
  ];
  
  if (excludedKeys.some(excluded => key.toLowerCase().includes(excluded))) {
    return false;
  }
  
  // Исключаем слишком общие ключи
  const tooGeneralKeys = ['наименование', 'параметр', 'свойство', 'особенность'];
  if (tooGeneralKeys.some(general => key.toLowerCase().includes(general))) {
    return false;
  }
  
  return true;
}

/**
 * Нормализация ключа
 */
function normalizeKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  
  // Применяем синонимы - ищем лучший матч
  let bestMatch = null;
  let bestMatchLength = 0;
  
  for (const [wrong, correct] of Object.entries(KEY_SYNONYMS)) {
    if (normalized.includes(wrong.toLowerCase()) && wrong.length > bestMatchLength) {
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

/**
 * Нормализация значения
 */
function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '.')
    .replace(/\s*м³/g, ' м³')
    .replace(/\s*м3/g, ' м³')
    .replace(/\s*л\.с\./g, ' л.с.')
    .replace(/гсм2/g, 'кг/см²')
    .replace(/д\/мин/g, 'л/мин')
    .replace(/\s*kg\/cm²/g, ' кг/см²')
    .replace(/\s*bar/g, ' бар')
    .replace(/\s*l\/min/g, ' л/мин');
}

/**
 * Извлечение единицы измерения
 */
function extractUnit(value: string): string | undefined {
  const unitPatterns = [
    /([\d.,\s]+)\s*([а-яa-z²³%/°·¬≤≥±]+\s*[а-ya-z²³%/°·¬≤≥±]*)$/i,
    /([\d.,\s]+)\s*([km]?[m³]|[liters|litres|kg|t|kW|hp|rpm|bar|MPa]+)$/i
  ];
  
  for (const pattern of unitPatterns) {
    const match = value.match(pattern);
    if (match) {
      return match[2].trim();
    }
  }
  
  return undefined;
}

/**
 * Определение категории
 */
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
    'rpm': 'Двигатель',
    'hp': 'Двигатель',
    'kw': 'Двигатель',
    'nm': 'Двигатель',
    'мм': 'Размеры',
    'см': 'Размеры', 
    'м': 'Размеры',
    'кг': 'Размеры',
    'т': 'Размеры',
    'ton': 'Размеры',
    'm': 'Размеры',
    'cm': 'Размеры',
    'mm': 'Размеры',
    'kg': 'Размеры',
    'м³': 'Производительность',
    'м3': 'Производительность',
    'm³': 'Производительность',
    'm3': 'Производительность',
    'л': 'Емкости',
    'l': 'Емкости',
    'liter': 'Емкости',
    'litre': 'Емкости',
    'л/мин': 'Гидравлическая система',
    'д/мин': 'Гидравлическая система',
    'l/min': 'Гидравлическая система',
    'lpm': 'Гидравлическая система',
    'бар': 'Гидравлическая система',
    'мпа': 'Гидравлическая система',
    'кг/см': 'Гидравлическая система',
    'bar': 'Гидравлическая система',
    'mpa': 'Гидравлическая система',
    'об/мин': 'Производительность',
    'rpm': 'Производительность',
    'км/ч': 'Ходовые характеристики',
    'km/h': 'Ходовые характеристики',
    'кн': 'Производительность',
    'kn': 'Производительность',
    '%': 'Ходовые характеристики'
  };

  for (const [unitPattern, category] of Object.entries(unitCategories)) {
    if (lowerUnit.includes(unitPattern)) {
      return category;
    }
  }

  return 'Общие';
}

/**
 * Проверка строки-разделителя
 */
function isSeparatorLine(line: string): boolean {
  const separators = ['---', '===', '***', '___', '––––', '===='];
  if (separators.some(sep => line.startsWith(sep))) return true;
  
  // Проверяем строки, состоящие только из специальных символов
  if (line.replace(/[=\-*_~]/g, '').trim().length === 0) return true;
  
  return false;
}

/**
 * Объединение дубликатов
 */
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

/**
 * Объединение похожих характеристик
 */
function mergeSimilarSpecs(specs: ParsedSpec[]): ParsedSpec[] {
  const similarityGroups: Record<string, ParsedSpec[]> = {};
  
  // Группируем похожие характеристики
  specs.forEach(spec => {
    const baseKey = getBaseKey(spec.key);
    if (!similarityGroups[baseKey]) {
      similarityGroups[baseKey] = [];
    }
    similarityGroups[baseKey].push(spec);
  });
  
  // Выбираем лучшую из каждой группы
  const merged: ParsedSpec[] = [];
  Object.values(similarityGroups).forEach(group => {
    if (group.length === 1) {
      merged.push(group[0]);
    } else {
      const bestSpec = selectBestSpecFromGroup(group);
      merged.push(bestSpec);
    }
  });
  
  return merged;
}

/**
 * Получение базового ключа для группировки
 */
function getBaseKey(key: string): string {
  const baseForms: Record<string, string> = {
    'мощность двигателя': 'мощность',
    'мощность': 'мощность',
    'номинальная мощность': 'мощность',
    'максимальная мощность': 'мощность',
    'рабочий вес': 'вес',
    'вес': 'вес',
    'масса': 'вес',
    'эксплуатационная масса': 'вес',
    'объем ковша': 'ковш',
    'емкость ковша': 'ковш',
    'ковш': 'ковш',
    'engine power': 'мощность',
    'operating weight': 'вес',
    'bucket capacity': 'ковш'
  };
  
  return baseForms[key.toLowerCase()] || key.toLowerCase();
}

/**
 * Выбор лучшей спецификации из группы
 */
function selectBestSpecFromGroup(group: ParsedSpec[]): ParsedSpec {
  return group.sort((a, b) => {
    // Приоритет: есть единицы измерения
    if (a.unit && !b.unit) return -1;
    if (!a.unit && b.unit) return 1;
    
    // Приоритет: более длинное значение (более полное)
    if (a.value.length > b.value.length) return -1;
    if (a.value.length < b.value.length) return 1;
    
    // Приоритет: из таблицы
    if (a.rawText.includes('|') && !b.rawText.includes('|')) return -1;
    if (!a.rawText.includes('|') && b.rawText.includes('|')) return 1;
    
    // Приоритет: более высокая уверенность (для AI)
    if (a.confidence && b.confidence) {
      return b.confidence - a.confidence;
    }
    
    return 0;
  })[0];
}

/**
 * Сравнение спецификаций для выбора лучшей
 */
function isBetterSpec(newSpec: ParsedSpec, existingSpec: ParsedSpec): boolean {
  // Предпочитаем спецификации с единицами измерения
  if (newSpec.unit && !existingSpec.unit) return true;
  // Предпочитаем более полные значения
  if (newSpec.value.length > existingSpec.value.length) return true;
  // Предпочитаем значения из таблиц (обычно более структурированы)
  if (newSpec.rawText.includes('|') && !existingSpec.rawText.includes('|')) return true;
  // Предпочитаем более высокую уверенность (для AI)
  if (newSpec.confidence && existingSpec.confidence && newSpec.confidence > existingSpec.confidence) return true;
  return false;
}

/**
 * Конвертация в JSON формат
 */
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

/**
 * Форматирование результата для вывода
 */
export function formatSpecifications(specs: ParsedSpec[]): string {
  const json = convertParsedToJSON(specs);
  const output: string[] = [];

  Object.entries(json).forEach(([category, properties]) => {
    output.push(category);
    output.push(JSON.stringify(properties, null, 2));
    output.push(''); // Пустая строка для разделения
  });

  return output.join('\n');
}

/**
 * Функция для тестирования парсера
 */
export function testParser(text: string, useAI: boolean = false) {
  const specs = parseSpecificationsFromTextAdvanced(text, { useAI });
  const json = convertParsedToJSON(specs);
  
  console.log('=== РЕЗУЛЬТАТЫ ПАРСИНГА ===');
  console.log(`Режим: ${useAI ? 'AI' : 'Стандартный'}`);
  console.log(`Всего характеристик: ${specs.length}`);
  console.log('По категориям:');
  Object.entries(json).forEach(([category, specs]) => {
    console.log(`  ${category}: ${Object.keys(specs).length} характеристик`);
  });
  
  // Показываем уверенность для AI-результатов
  if (useAI) {
    console.log('\n🔍 УВЕРЕННОСТЬ ИЗВЛЕЧЕНИЯ:');
    specs.forEach(spec => {
      const confidence = spec.confidence ? `${Math.round(spec.confidence * 100)}%` : 'N/A';
      console.log(`   ${spec.key}: ${confidence}`);
    });
  }
  
  console.log('\n📋 СТРУКТУРИРОВАННЫЕ ДАННЫЕ:');
  console.log(JSON.stringify(json, null, 2));
  
  return {
    specs,
    json,
    formatted: formatSpecifications(specs),
    stats: {
      total: specs.length,
      byCategory: Object.groupBy(specs, spec => spec.category)
    }
  };
}

/**
 * Тестирование с проблемным текстом
 */
export function testWithProblematicText() {
  const problematicText = `
Предварительная система
Производительность насосов: 180 л/мин
Диапазон: 250 бар

Блокиры
Техническая база: 150 л
Напряжение насоса: 12,8 л
Система пользователя: 16,2 л
Следопоставляя: 97 л
  `;

  console.log('🧪 ТЕСТИРОВАНИЕ С ПРОБЛЕМНЫМ ТЕКСТОМ');
  console.log('=' .repeat(50));
  
  // Тестируем стандартный парсер
  console.log('\n📊 СТАНДАРТНЫЙ ПАРСЕР:');
  const standardResult = testParser(problematicText, false);
  
  // Тестируем AI-парсер
  console.log('\n🤖 AI-ПАРСЕР:');
  const aiResult = testParser(problematicText, true);
  
  return {
    standard: standardResult,
    ai: aiResult
  };
}

/**
 * Пример использования
 */
export function exampleUsage() {
  const exampleText = `
Технические характеристики экскаватора-погрузчика Komatsu WB93S-5E0:

Двигатель
Производитель: Komatsu
Модель: SAA4D104E-1
Мощность: 74 кВт (101 л.с.)
Количество цилиндров: 4 шт
Крутящий момент: 420 Н·м

Габаритные размеры
Длина: 5895 мм
Ширина: 2440 мм  
Высота: 3390 мм
Вес: 8550 кг

Ковш погрузчика
Емкость ковша: 1,1 м³
Ширина ковша: 2440 мм
Грузоподъемность: 3900 кг

Гидравлическая система
Производительность насоса: 165 л/мин
Давление: 250 бар

Емкости
Топливный бак: 150 л
Моторное масло: 12,8 л
Система охлаждения: 16,5 л
Гидросистема: 97 л
  `;

  return testParser(exampleText);
}

// Экспорт утилитарных функций
export {
  SPEC_CATEGORIES,
  KEY_SYNONYMS,
  OCR_CORRECTIONS
};

// Запуск тестов
// exampleUsage();
// testWithProblematicText();
