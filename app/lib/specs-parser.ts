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
 * Конфигурация парсера
 */
interface ParserConfig {
  autoCategorize: boolean;
  autoTranslate: boolean;
  sortByPriority: boolean;
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
 * Создать пустую структуру характеристик
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

/**
 * Обработать массив данных
 */
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

/**
 * Обработать объект данных
 */
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

/**
 * Нормализовать одну характеристику
 */
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

/**
 * Нормализовать значение характеристики
 */
function normalizeValue(value: any): string | number {
  if (typeof value === 'number') return value;
  
  const strValue = String(value).trim();
  
  // Попытка извлечь числовое значение из строки
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

/**
 * Определить категорию характеристики по ключу
 */
function categorizeSpecKey(key: string): string {
  const keyLower = key.toLowerCase();

  // Двигатель и топливо
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

  // Габариты и вес
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

  // Производительность
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

  // Гидравлика
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

/**
 * Получить приоритет характеристики для сортировки
 */
function getSpecPriority(key: string): number {
  const priorityMap: Record<string, number> = {
    // Высокий приоритет
    'power': 1,
    'weight': 2,
    'bucket': 3,
    'engine': 4,
    
    // Средний приоритет
    'dimensions': 50,
    'performance': 51,
    'hydraulics': 52,
    
    // Низкий приоритет
    'other': 100
  };

  const keyLower = key.toLowerCase();
  
  for (const [pattern, priority] of Object.entries(priorityMap)) {
    if (keyLower.includes(pattern)) {
      return priority;
    }
  }

  // Приоритет по категории
  const category = categorizeSpecKey(key);
  return priorityMap[category] || 100;
}

/**
 * Получить единицу измерения по умолчанию
 */
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

/**
 * Форматировать ключ в читаемое название
 */
function formatLabel(key: string): string {
  // Русско-английский словарь переводов
  const translations: { [key: string]: string } = {
    // Английские ключи
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
    
    // Русские ключи
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

  // Сначала проверяем точное совпадение
  if (translations[key.toLowerCase()]) {
    return translations[key.toLowerCase()];
  }

  // Проверяем частичные совпадения
  for (const [en, ru] of Object.entries(translations)) {
    if (key.toLowerCase().includes(en)) {
      return ru;
    }
  }

  // Если перевод не найден, форматируем ключ
  const formatted = key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return formatted;
}

/**
 * Сортировать характеристики по приоритету
 */
function sortSpecificationsByPriority(specs: ParsedSpecifications): void {
  Object.keys(specs).forEach(category => {
    specs[category as keyof ParsedSpecifications].sort((a, b) => {
      const priorityA = a.priority || 999;
      const priorityB = b.priority || 999;
      return priorityA - priorityB;
    });
  });
}

/**
 * Форматировать характеристику для отображения
 */
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

/**
 * Получить краткую сводку характеристик для списка
 */
export function getSpecsSummary(specs: ParsedSpecifications): string {
  const summaryParts: string[] = [];

  // Добавить мощность если есть
  const powerSpec = specs.engine.find((s) =>
    s.key.toLowerCase().includes("power") || s.label.toLowerCase().includes("мощность")
  );
  if (powerSpec) {
    summaryParts.push(formatSpecification(powerSpec));
  }

  // Добавить вес если есть
  const weightSpec = specs.dimensions.find((s) =>
    s.key.toLowerCase().includes("weight") || 
    s.label.toLowerCase().includes("масса") || 
    s.label.toLowerCase().includes("вес")
  );
  if (weightSpec) {
    summaryParts.push(formatSpecification(weightSpec));
  }

  // Добавить объем ковша если есть
  const bucketSpec = specs.performance.find((s) =>
    s.key.toLowerCase().includes("bucket") || 
    s.label.toLowerCase().includes("ковш")
  );
  if (bucketSpec) {
    summaryParts.push(formatSpecification(bucketSpec));
  }

  return summaryParts.join(" | ") || "Характеристики не указаны";
}

/**
 * Фильтровать характеристики по категории
 */
export function filterSpecsByCategory(
  specs: ParsedSpecifications, 
  category: keyof ParsedSpecifications
): Specification[] {
  return specs[category] || [];
}

/**
 * Найти характеристику по ключу или метке
 */
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
