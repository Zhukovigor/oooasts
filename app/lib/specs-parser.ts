// Сервис для парсинга и форматирования характеристик техники

/**
 * Интерфейс для хранения одной характеристики
 */
export interface Specification {
  key: string; // Ключ характеристики (англ) - power, weight, volume и т.д.
  label: string; // Название (рус) - Мощность, Вес, Объем и т.д.
  value: string | number; // Значение
  unit?: string; // Единица измерения - кВт, тонн, м³ и т.д.
  category?: string; // Категория - engine, dimensions, performance и т.д.
  priority?: number; // Приоритет для сортировки
  confidence?: number; // Уверенность в правильности извлечения (0-1)
}

/**
 * Интерфейс для структурированных характеристик
 */
export interface ParsedSpecifications {
  engine: Specification[];
  dimensions: Specification[];
  performance: Specification[];
  hydraulics: Specification[];
  other: Specification[];
}

/**
 * Интерфейс для AI-парсера
 */
export interface AIParsedSpec {
  category: string;
  key: string;
  value: string;
  unit?: string;
  rawText: string;
  confidence: number;
}

/**
 * Конфигурация парсера
 */
interface ParserConfig {
  autoCategorize: boolean;
  autoTranslate: boolean;
  sortByPriority: boolean;
  useAI: boolean; // Использовать AI для сложных случаев
  minConfidence: number; // Минимальная уверенность для AI-результатов
}

/**
 * Парсить JSON характеристики из базы данных
 */
export function parseSpecifications(
  specJson: any, 
  config: Partial<ParserConfig> = {}
): ParsedSpecifications {
  const defaultConfig: ParserConfig = {
    autoCategorize: true,
    autoTranslate: true,
    sortByPriority: true,
    useAI: false,
    minConfidence: 0.6,
    ...config
  };

  if (!specJson) {
    return getEmptySpecifications();
  }

  const specs: ParsedSpecifications = getEmptySpecifications();

  try {
    // Если это строка, парсим как JSON
    const data = typeof specJson === "string" ? JSON.parse(specJson) : specJson;

    if (Array.isArray(data)) {
      // Если это массив спецификаций
      processArrayData(data, specs, defaultConfig);
    } else if (typeof data === "object") {
      // Если это объект с ключами
      processObjectData(data, specs, defaultConfig);
    }

    // Сортировка по приоритету
    if (defaultConfig.sortByPriority) {
      sortSpecificationsByPriority(specs);
    }

  } catch (error) {
    console.error('Error parsing specifications:', error);
    return getEmptySpecifications();
  }

  return specs;
}

/**
 * Парсить характеристики из текста с использованием AI
 */
export function parseSpecificationsFromText(
  text: string,
  config: Partial<ParserConfig> = {}
): ParsedSpecifications {
  const defaultConfig: ParserConfig = {
    autoCategorize: true,
    autoTranslate: true,
    sortByPriority: true,
    useAI: true,
    minConfidence: 0.6,
    ...config
  };

  const specs: ParsedSpecifications = getEmptySpecifications();

  try {
    let aiSpecs: AIParsedSpec[] = [];

    if (defaultConfig.useAI) {
      // Используем AI-парсер для сложных случаев
      aiSpecs = parseSpecificationsWithAI(text);
    } else {
      // Используем обычный парсер
      aiSpecs = parseSpecificationsWithBasic(text);
    }

    // Конвертируем AI-результаты в стандартный формат
    aiSpecs.forEach(aiSpec => {
      if (aiSpec.confidence >= defaultConfig.minConfidence) {
        const spec = convertAISpecToStandard(aiSpec, defaultConfig);
        const category = mapCategoryToEnglish(spec.category || 'other') as keyof ParsedSpecifications;
        
        if (category in specs) {
          specs[category].push(spec);
        } else {
          specs.other.push(spec);
        }
      }
    });

    // Сортировка по приоритету
    if (defaultConfig.sortByPriority) {
      sortSpecificationsByPriority(specs);
    }

  } catch (error) {
    console.error('Error parsing specifications from text:', error);
    return getEmptySpecifications();
  }

  return specs;
}

/**
 * Конвертировать AI-спецификацию в стандартный формат
 */
function convertAISpecToStandard(aiSpec: AIParsedSpec, config: ParserConfig): Specification {
  const key = generateEnglishKey(aiSpec.key);
  const category = mapCategoryToEnglish(aiSpec.category);
  
  return {
    key,
    label: config.autoTranslate ? formatLabel(key) : aiSpec.key,
    value: normalizeValue(aiSpec.value),
    unit: aiSpec.unit,
    category,
    priority: getSpecPriority(key),
    confidence: aiSpec.confidence
  };
}

/**
 * Базовый парсер для текста (без AI)
 */
function parseSpecificationsWithBasic(text: string): AIParsedSpec[] {
  const specs: AIParsedSpec[] = [];
  const lines = text.split('\n').filter(line => line.trim().length > 3);

  let currentCategory = "Общие";

  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Пропускаем заголовки и разделители
    if (isHeaderLine(trimmed)) {
      const category = detectBasicCategory(trimmed);
      if (category) currentCategory = category;
      return;
    }

    // Парсим простые форматы
    const spec = parseBasicLine(trimmed, currentCategory);
    if (spec) {
      specs.push(spec);
    }
  });

  return specs;
}

/**
 * AI-парсер для сложных случаев
 */
function parseSpecificationsWithAI(text: string): AIParsedSpec[] {
  const specs: AIParsedSpec[] = [];
  const lines = text.split("\n").filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 3 && 
           !trimmed.startsWith('#') && 
           !trimmed.startsWith('---') &&
           !trimmed.startsWith('|') &&
           !trimmed.includes('Примечание');
  });

  // Словарь для исправления OCR-ошибок
  const OCR_CORRECTIONS: Record<string, string> = {
    'предварительная система': 'гидравлическая система',
    'производительность насосов': 'производительность насоса',
    'блокиры': 'емкости',
    'техническая база': 'топливный бак',
    'напряжение насоса': 'моторное масло',
    'система пользователя': 'система охлаждения',
    'следопоставляя': 'гидросистема',
    'диапазон': 'давление'
  };

  let currentCategory = "Общие";
  const processed = new Set<string>();

  for (const line of lines) {
    // Исправляем OCR-ошибки
    let correctedLine = line.toLowerCase();
    Object.entries(OCR_CORRECTIONS).forEach(([wrong, correct]) => {
      if (correctedLine.includes(wrong)) {
        correctedLine = correctedLine.replace(wrong, correct);
      }
    });

    // Определяем категорию
    const category = detectAICategory(correctedLine, currentCategory);
    if (category && category !== currentCategory) {
      currentCategory = category;
      continue;
    }

    // Парсим строку
    const parsed = parseAILine(correctedLine, currentCategory);
    if (parsed) {
      const specId = `${parsed.category}_${parsed.key}`;
      if (!processed.has(specId)) {
        processed.add(specId);
        specs.push(parsed);
      }
    }
  }

  return filterAndSortAISpecs(specs);
}

/**
 * Парсинг строки с AI-подходом
 */
function parseAILine(line: string, category: string): AIParsedSpec | null {
  // Пробуем разные форматы
  const formats = [
    parseColonFormat,
    parseKeyValueFormat,
    parseNumericFormat
  ];

  let bestResult: AIParsedSpec | null = null;
  let bestConfidence = 0;

  for (const format of formats) {
    const result = format(line, category);
    if (result && result.confidence > bestConfidence) {
      bestResult = result;
      bestConfidence = result.confidence;
    }
  }

  return bestResult;
}

/**
 * Парсинг формата "Ключ: Значение"
 */
function parseColonFormat(line: string, category: string): AIParsedSpec | null {
  const match = line.match(/^([^:]{3,50}?)\s*[:]\s*(.+)$/i);
  if (!match) return null;

  const [, rawKey, rawValue] = match;
  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(rawKey.trim());
  const { value, unit, confidence: valueConfidence } = parseValueWithConfidence(rawValue.trim());

  const overallConfidence = (keyConfidence + valueConfidence) / 2;

  if (overallConfidence > 0.3) {
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
function parseKeyValueFormat(line: string, category: string): AIParsedSpec | null {
  const match = line.match(/^([а-яa-z\s]{3,40}?)\s+([\d.,]+)\s*([а-яa-z\/²³%°]*)$/i);
  if (!match) return null;

  const [, rawKey, rawValue, rawUnit] = match;
  const { key, confidence: keyConfidence } = normalizeKeyWithConfidence(rawKey.trim());
  const { value, unit, confidence: valueConfidence } = parseValueWithConfidence(rawValue.trim(), rawUnit.trim());

  const overallConfidence = (keyConfidence + valueConfidence) / 2;

  if (overallConfidence > 0.4) {
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
function parseNumericFormat(line: string, category: string): AIParsedSpec | null {
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

  if (overallConfidence > 0.3) {
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
 * Нормализация ключа с оценкой уверенности
 */
function normalizeKeyWithConfidence(rawKey: string): { key: string; confidence: number } {
  const knownKeys: Record<string, { correct: string; confidence: number }> = {
    'производительность насоса': { correct: 'Производительность насоса', confidence: 0.9 },
    'давление': { correct: 'Давление в системе', confidence: 0.9 },
    'топливный бак': { correct: 'Топливный бак', confidence: 0.9 },
    'моторное масло': { correct: 'Моторное масло', confidence: 0.9 },
    'система охлаждения': { correct: 'Система охлаждения', confidence: 0.9 },
    'гидросистема': { correct: 'Объем гидросистемы', confidence: 0.8 },
    'производитель': { correct: 'Производитель', confidence: 0.9 },
    'модель': { correct: 'Модель', confidence: 0.9 }
  };

  const lowerKey = rawKey.toLowerCase().trim();

  for (const [wrong, data] of Object.entries(knownKeys)) {
    if (lowerKey.includes(wrong)) {
      return { key: data.correct, confidence: data.confidence };
    }
  }

  const normalized = rawKey
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return { key: normalized, confidence: 0.3 };
}

/**
 * Парсинг значения с оценкой уверенности
 */
function parseValueWithConfidence(rawValue: string, rawUnit: string = ''): { 
  value: string; 
  unit?: string; 
  confidence: number 
} {
  const numberMatch = rawValue.match(/^([\d.,]+)/);
  if (!numberMatch) {
    return { value: rawValue, confidence: 0.1 };
  }

  const numberStr = numberMatch[1].replace(',', '.');
  const numberValue = parseFloat(numberStr);

  if (isNaN(numberValue)) {
    return { value: rawValue, confidence: 0.1 };
  }

  let unit = rawUnit;
  if (!unit) {
    const unitMatch = rawValue.replace(numberStr, '').trim();
    if (unitMatch) {
      unit = normalizeUnit(unitMatch);
    }
  } else {
    unit = normalizeUnit(unit);
  }

  let confidence = 0.7;

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
 * Определение категории AI
 */
function detectAICategory(line: string, currentCategory: string): string | null {
  const AI_CATEGORIES: Record<string, { keywords: string[]; priority: number }> = {
    "Гидравлическая система": {
      keywords: ["гидравлика", "насос", "давление", "производительность", "диапазон", "бар", "л/мин"],
      priority: 1
    },
    "Емкости": {
      keywords: ["топливный", "масло", "охлаждение", "гидросистема", "бак", "емкость", "л", "литр"],
      priority: 2
    },
    "Двигатель": {
      keywords: ["двигатель", "мощность", "квт", "л.с.", "цилиндр", "момент"],
      priority: 3
    },
    "Общие": {
      keywords: ["производитель", "модель", "назначение", "тип"],
      priority: 10
    }
  };

  const lowerLine = line.toLowerCase();
  const categoryScores: Record<string, number> = {};
  
  Object.entries(AI_CATEGORIES).forEach(([category, data]) => {
    let score = 0;
    
    data.keywords.forEach(keyword => {
      if (lowerLine.includes(keyword)) {
        score += 2;
      }
    });

    if (isLikelyHeader(line)) {
      score += 3;
    }

    score += (10 - data.priority) * 0.1;
    categoryScores[category] = score;
  });

  const bestCategory = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)[0];

  return bestCategory && bestCategory[1] > 1 ? bestCategory[0] : null;
}

/**
 * Базовое определение категории
 */
function detectBasicCategory(line: string): string | null {
  const lowerLine = line.toLowerCase();
  
  if (lowerLine.includes('гидравли') || lowerLine.includes('насос')) return "Гидравлическая система";
  if (lowerLine.includes('топлив') || lowerLine.includes('масло') || lowerLine.includes('емкост')) return "Емкости";
  if (lowerLine.includes('двигатель') || lowerLine.includes('мощность')) return "Двигатель";
  if (lowerLine.includes('размер') || lowerLine.includes('габарит')) return "Размеры";
  
  return null;
}

/**
 * Базовый парсинг строки
 */
function parseBasicLine(line: string, category: string): AIParsedSpec | null {
  const colonMatch = line.match(/^([^:]{3,50}?)\s*[:]\s*(.+)$/i);
  if (colonMatch) {
    const [, key, value] = colonMatch;
    return {
      category,
      key: key.trim(),
      value: value.trim(),
      rawText: line,
      confidence: 0.7
    };
  }
  return null;
}

/**
 * Вспомогательные функции (остаются без изменений)
 */

function getEmptySpecifications(): ParsedSpecifications {
  return {
    engine: [],
    dimensions: [],
    performance: [],
    hydraulics: [],
    other: [],
  };
}

function processArrayData(
  data: any[], 
  specs: ParsedSpecifications, 
  config: ParserConfig
): void {
  data.forEach((spec) => {
    const parsedSpec = normalizeSpecification(spec, config);
    const category = parsedSpec.category || "other";

    if (category in specs) {
      specs[category as keyof ParsedSpecifications].push(parsedSpec);
    } else {
      specs.other.push(parsedSpec);
    }
  });
}

function processObjectData(
  data: Record<string, any>, 
  specs: ParsedSpecifications, 
  config: ParserConfig
): void {
  Object.entries(data).forEach(([key, value]) => {
    const parsedSpec = normalizeSpecification({
      key,
      value,
    }, config);

    const category = parsedSpec.category || (config.autoCategorize ? categorizeSpecKey(key) : "other");
    
    if (category in specs) {
      specs[category as keyof ParsedSpecifications].push(parsedSpec);
    } else {
      specs.other.push(parsedSpec);
    }
  });
}

function normalizeSpecification(spec: any, config?: ParserConfig): Specification {
  if (typeof spec === "string" || typeof spec === "number") {
    return {
      key: "",
      label: "",
      value: spec,
      category: "other",
      priority: 999,
    };
  }

  const key = spec.key || spec.id || "";
  const label = config?.autoTranslate 
    ? (spec.label || spec.name || formatLabel(key))
    : (spec.label || spec.name || key);

  const normalizedValue = normalizeValue(spec.value !== undefined ? spec.value : spec);
  const unit = spec.unit || spec.units || getDefaultUnit(key);
  const category = spec.category || (config?.autoCategorize ? categorizeSpecKey(key) : "other");
  const priority = getSpecPriority(key);

  return {
    key,
    label,
    value: normalizedValue,
    unit,
    category,
    priority,
  };
}

function normalizeValue(value: any): string | number {
  if (typeof value === 'number') return value;
  
  const strValue = String(value).trim();
  
  const numberMatch = strValue.match(/^([\d.,]+)/);
  if (numberMatch) {
    const numberStr = numberMatch[1].replace(',', '.');
    const numberValue = parseFloat(numberStr);
    if (!isNaN(numberValue)) {
      return numberValue;
    }
  }
  
  return strValue;
}

function categorizeSpecKey(key: string): string {
  const keyLower = key.toLowerCase();

  if (
    keyLower.includes("engine") ||
    keyLower.includes("power") ||
    keyLower.includes("fuel") ||
    keyLower.includes("мощность") ||
    keyLower.includes("двигатель") ||
    keyLower.includes("топливо") ||
    keyLower.includes("крутящий") ||
    keyLower.includes("цилиндр") ||
    keyLower.includes("л.с.") ||
    keyLower.includes("квт")
  ) {
    return "engine";
  }

  if (
    keyLower.includes("weight") ||
    keyLower.includes("dimension") ||
    keyLower.includes("height") ||
    keyLower.includes("width") ||
    keyLower.includes("length") ||
    keyLower.includes("масса") ||
    keyLower.includes("вес") ||
    keyLower.includes("длина") ||
    keyLower.includes("ширина") ||
    keyLower.includes("высота") ||
    keyLower.includes("габарит") ||
    keyLower.includes("кг") ||
    keyLower.includes("мм") ||
    keyLower.includes("м")
  ) {
    return "dimensions";
  }

  if (
    keyLower.includes("depth") ||
    keyLower.includes("reach") ||
    keyLower.includes("bucket") ||
    keyLower.includes("speed") ||
    keyLower.includes("capacity") ||
    keyLower.includes("грузоподъемность") ||
    keyLower.includes("емкость") ||
    keyLower.includes("ковш") ||
    keyLower.includes("скорость") ||
    keyLower.includes("глубина") ||
    keyLower.includes("радиус") ||
    keyLower.includes("м³") ||
    keyLower.includes("м3")
  ) {
    return "performance";
  }

  if (
    keyLower.includes("pressure") ||
    keyLower.includes("flow") ||
    keyLower.includes("pump") ||
    keyLower.includes("hydraulic") ||
    keyLower.includes("гидравлика") ||
    keyLower.includes("давление") ||
    keyLower.includes("насос") ||
    keyLower.includes("расход") ||
    keyLower.includes("бар") ||
    keyLower.includes("л/мин")
  ) {
    return "hydraulics";
  }

  return "other";
}

function getSpecPriority(key: string): number {
  const priorityMap: Record<string, number> = {
    'power': 1,
    'weight': 2,
    'bucket': 3,
    'engine': 4,
    'dimensions': 50,
    'performance': 51,
    'hydraulics': 52,
    'other': 100
  };

  const keyLower = key.toLowerCase();
  
  for (const [pattern, priority] of Object.entries(priorityMap)) {
    if (keyLower.includes(pattern)) {
      return priority;
    }
  }

  const category = categorizeSpecKey(key);
  return priorityMap[category] || 100;
}

function getDefaultUnit(key: string): string {
  const keyLower = key.toLowerCase();

  if (keyLower.includes("power") || keyLower.includes("мощность")) return "кВт";
  if (keyLower.includes("weight") || keyLower.includes("масса") || keyLower.includes("вес")) return "кг";
  if (keyLower.includes("volume") || keyLower.includes("объем") || keyLower.includes("емкость")) return "м³";
  if (keyLower.includes("depth") || keyLower.includes("глубина") || keyLower.includes("reach")) return "мм";
  if (keyLower.includes("pressure") || keyLower.includes("давление")) return "бар";
  if (keyLower.includes("flow") || keyLower.includes("расход")) return "л/мин";
  if (keyLower.includes("speed") || keyLower.includes("скорость")) return "км/ч";
  if (keyLower.includes("length") || keyLower.includes("длина")) return "мм";
  if (keyLower.includes("width") || keyLower.includes("ширина")) return "мм";
  if (keyLower.includes("height") || keyLower.includes("высота")) return "мм";

  return "";
}

function formatLabel(key: string): string {
  const translations: { [key: string]: string } = {
    'power': 'Мощность',
    'engine': 'Двигатель',
    'weight': 'Вес',
    'volume': 'Объем',
    'depth': 'Глубина копания',
    'reach': 'Максимальный радиус',
    'bucket': 'Объем ковша',
    'fuel': 'Топливный бак',
    'length': 'Длина',
    'width': 'Ширина',
    'height': 'Высота',
    'pressure': 'Давление',
    'flow': 'Расход',
    'speed': 'Скорость',
    'capacity': 'Емкость',
    'мощность': 'Мощность',
    'двигатель': 'Двигатель',
    'масса': 'Масса',
    'вес': 'Вес',
    'объем': 'Объем',
    'грузоподъемность': 'Грузоподъемность',
    'емкость': 'Емкость',
    'ковш': 'Ковш',
    'лопата': 'Лопата',
    'скорость': 'Скорость',
    'давление': 'Давление',
    'расход': 'Расход',
    'насос': 'Насос',
    'гидравлика': 'Гидравлическая система',
    'топливо': 'Топливный бак',
    'охлаждение': 'Система охлаждения',
    'масло': 'Моторное масло'
  };

  if (translations[key.toLowerCase()]) {
    return translations[key.toLowerCase()];
  }

  for (const [en, ru] of Object.entries(translations)) {
    if (key.toLowerCase().includes(en)) {
      return ru;
    }
  }

  const formatted = key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return formatted;
}

function sortSpecificationsByPriority(specs: ParsedSpecifications): void {
  Object.keys(specs).forEach(category => {
    specs[category as keyof ParsedSpecifications].sort((a, b) => {
      const priorityA = a.priority || 999;
      const priorityB = b.priority || 999;
      return priorityA - priorityB;
    });
  });
}

export function formatSpecification(spec: Specification): string {
  if (typeof spec.value === 'number') {
    const formattedValue = Number.isInteger(spec.value) 
      ? spec.value.toString()
      : spec.value.toFixed(2).replace('.00', '');
    
    if (spec.unit) {
      return `${formattedValue} ${spec.unit}`;
    }
    return formattedValue;
  }

  if (spec.unit && !spec.value.includes(spec.unit)) {
    return `${spec.value} ${spec.unit}`;
  }

  return String(spec.value);
}

export function getSpecsSummary(specs: ParsedSpecifications): string {
  const summaryParts: string[] = [];

  const powerSpec = specs.engine.find((s) =>
    s.key.toLowerCase().includes("power") || s.label.toLowerCase().includes("мощность")
  );
  if (powerSpec) {
    summaryParts.push(formatSpecification(powerSpec));
  }

  const weightSpec = specs.dimensions.find((s) =>
    s.key.toLowerCase().includes("weight") || 
    s.label.toLowerCase().includes("масса") || 
    s.label.toLowerCase().includes("вес")
  );
  if (weightSpec) {
    summaryParts.push(formatSpecification(weightSpec));
  }

  const bucketSpec = specs.performance.find((s) =>
    s.key.toLowerCase().includes("bucket") || 
    s.label.toLowerCase().includes("ковш")
  );
  if (bucketSpec) {
    summaryParts.push(formatSpecification(bucketSpec));
  }

  return summaryParts.join(" | ") || "Характеристики не указаны";
}

export function filterSpecsByCategory(
  specs: ParsedSpecifications, 
  category: keyof ParsedSpecifications
): Specification[] {
  return specs[category] || [];
}

export function findSpecification(
  specs: ParsedSpecifications, 
  searchTerm: string
): Specification | undefined {
  const searchLower = searchTerm.toLowerCase();
  
  for (const category of Object.values(specs)) {
    const found = category.find(spec => 
      spec.key.toLowerCase().includes(searchLower) ||
      spec.label.toLowerCase().includes(searchLower)
    );
    if (found) return found;
  }
  
  return undefined;
}

/**
 * Вспомогательные функции для AI-парсера
 */

function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'л/мин': 'л/мин',
    'л': 'л',
    'бар': 'бар',
    'литр': 'л',
    'литров': 'л',
    'литры': 'л'
  };

  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || unit;
}

function filterAndSortAISpecs(specs: AIParsedSpec[]): AIParsedSpec[] {
  const filtered = specs.filter(spec => spec.confidence > 0.4);
  const unique = Array.from(new Map(
    filtered.map(spec => [`${spec.category}_${spec.key}`, spec])
  ).values());

  return unique.sort((a, b) => {
    const categoryOrder = ["Гидравлическая система", "Емкости", "Двигатель", "Размеры", "Общие"];
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);
    
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    
    return b.confidence - a.confidence;
  });
}

function isLikelyHeader(line: string): boolean {
  return line.length < 50 && 
         !line.match(/[\d.,]/) && 
         (line === line.toUpperCase() ||
         line.endsWith(':') ||
         (line.split(' ').length <= 3 && line.length > 5));
}

function isHeaderLine(line: string): boolean {
  const headerIndicators = ['характеристики', 'технические', 'спецификации', '===', '---', '###'];
  const lowerLine = line.toLowerCase();
  return headerIndicators.some(indicator => lowerLine.includes(indicator));
}

function generateEnglishKey(russianKey: string): string {
  const translations: Record<string, string> = {
    'Производительность насоса': 'pump_flow',
    'Давление в системе': 'system_pressure',
    'Топливный бак': 'fuel_tank',
    'Моторное масло': 'engine_oil',
    'Система охлаждения': 'cooling_system',
    'Объем гидросистемы': 'hydraulic_system_volume',
    'Производитель': 'manufacturer',
    'Модель': 'model',
    'Мощность двигателя': 'engine_power',
    'Рабочий вес': 'operating_weight',
    'Объем ковша': 'bucket_capacity',
    'Грузоподъемность': 'load_capacity',
    'Длина': 'length',
    'Ширина': 'width',
    'Высота': 'height'
  };

  return translations[russianKey] || russianKey
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_');
}

function mapCategoryToEnglish(russianCategory: string): string {
  const categoryMap: Record<string, string> = {
    'Двигатель': 'engine',
    'Гидравлическая система': 'hydraulics',
    'Емкости': 'other',
    'Размеры': 'dimensions',
    'Производительность': 'performance',
    'Общие': 'other'
  };

  return categoryMap[russianCategory] || 'other';
}

/**
 * Тестовая функция для демонстрации
 */
export function testAIParserWithText() {
  const testText = `
Предварительная система
Производительность насосов: 180 л/мин
Диапазон: 250 бар

Блокиры
Техническая база: 150 л
Напряжение насоса: 12,8 л
Система пользователя: 16,2 л
Следопоставляя: 97 л
  `;

  console.log('🔍 AI-ПАРСИНГ ТЕКСТА С ХАРАКТЕРИСТИКАМИ');
  console.log('=' .repeat(50));
  
  const specs = parseSpecificationsFromText(testText, { useAI: true });
  
  Object.entries(specs).forEach(([category, categorySpecs]) => {
    if (categorySpecs.length > 0) {
      console.log(`\n📁 ${category.toUpperCase()}:`);
      categorySpecs.forEach(spec => {
        const value = formatSpecification(spec);
        const confidence = spec.confidence ? ` (${Math.round(spec.confidence * 100)}%)` : '';
        console.log(`   ✅ ${spec.label}: ${value}${confidence}`);
      });
    }
  });

  console.log(`\n📊 ИТОГО: ${Object.values(specs).flat().length} характеристик извлечено`);
  console.log(`📋 СВОДКА: ${getSpecsSummary(specs)}`);
  
  return specs;
}

// Запуск теста
// testAIParserWithText();
