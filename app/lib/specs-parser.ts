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
 * Парсить JSON характеристики из базы данных
 */
export function parseSpecifications(specJson: any): ParsedSpecifications {
  if (!specJson) {
    return {
      engine: [],
      dimensions: [],
      performance: [],
      hydraulics: [],
      other: [],
    };
  }

  const specs: ParsedSpecifications = {
    engine: [],
    dimensions: [],
    performance: [],
    hydraulics: [],
    other: [],
  };

  // Если это строка, парсим как JSON
  const data = typeof specJson === "string" ? JSON.parse(specJson) : specJson;

  if (Array.isArray(data)) {
    // Если это массив спецификаций
    data.forEach((spec) => {
      const parsedSpec = normalizeSpecification(spec);
      const category = parsedSpec.category || "other";

      if (category in specs) {
        specs[category as keyof ParsedSpecifications].push(parsedSpec);
      } else {
        specs.other.push(parsedSpec);
      }
    });
  } else if (typeof data === "object") {
    // Если это объект с ключами
    Object.entries(data).forEach(([key, value]) => {
      const parsedSpec = normalizeSpecification({
        key,
        value,
      });

      const category = parsedSpec.category || categorizeSpecKey(key);
      if (category in specs) {
        specs[category as keyof ParsedSpecifications].push(parsedSpec);
      } else {
        specs.other.push(parsedSpec);
      }
    });
  }

  return specs;
}

/**
 * Нормализовать одну характеристику
 */
function normalizeSpecification(spec: any): Specification {
  if (typeof spec === "string" || typeof spec === "number") {
    return {
      key: "",
      label: "",
      value: spec,
      category: "other",
    };
  }

  const key = spec.key || spec.id || "";
  const label = spec.label || spec.name || formatLabel(key);

  return {
    key,
    label,
    value: spec.value !== undefined ? spec.value : spec,
    unit: spec.unit || spec.units || getDefaultUnit(key),
    category: spec.category || categorizeSpecKey(key),
  };
}

/**
 * Определить категорию характеристики по ключу
 */
function categorizeSpecKey(key: string): string {
  const keyLower = key.toLowerCase();

  if (
    keyLower.includes("engine") ||
    keyLower.includes("power") ||
    keyLower.includes("fuel")
  ) {
    return "engine";
  }
  if (
    keyLower.includes("weight") ||
    keyLower.includes("dimension") ||
    keyLower.includes("height") ||
    keyLower.includes("width") ||
    keyLower.includes("length")
  ) {
    return "dimensions";
  }
  if (
    keyLower.includes("depth") ||
    keyLower.includes("reach") ||
    keyLower.includes("bucket") ||
    keyLower.includes("speed")
  ) {
    return "performance";
  }
  if (
    keyLower.includes("pressure") ||
    keyLower.includes("flow") ||
    keyLower.includes("pump")
  ) {
    return "hydraulics";
  }

  return "other";
}

/**
 * Получить единицу измерения по умолчанию
 */
function getDefaultUnit(key: string): string {
  const keyLower = key.toLowerCase();

  if (keyLower.includes("power")) return "кВт";
  if (keyLower.includes("weight")) return "тонн";
  if (keyLower.includes("volume")) return "м³";
  if (keyLower.includes("depth") || keyLower.includes("reach"))
    return "мм";
  if (keyLower.includes("pressure")) return "бар";
  if (keyLower.includes("flow")) return "л/мин";
  if (keyLower.includes("speed")) return "км/ч";

  return "";
}

/**
 * Форматировать ключ в читаемое название
 */
function formatLabel(key: string): string {
  // Преобразовать camelCase или snake_case в обычный текст
  const formatted = key
    .replace(/([A-Z])/g, " $1") // camelCase
    .replace(/_/g, " ") // snake_case
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // Капитализировать первую букву

  // Определенные переводы
  const translations: { [key: string]: string } = {
    power: "Мощность",
    engine: "Двигатель",
    weight: "Вес",
    volume: "Объем",
    depth: "Глубина копания",
    reach: "Максимальный радиус",
    bucket: "Объем ковша",
    fuel: "Топливо",
  };

  return translations[key.toLowerCase()] || formatted;
}

/**
 * Форматировать характеристику для отображения
 */
export function formatSpecification(spec: Specification): string {
  if (spec.unit) {
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
    s.key.toLowerCase().includes("power")
  );
  if (powerSpec) {
    summaryParts.push(`${powerSpec.value}${powerSpec.unit || " кВт"}`);
  }

  // Добавить вес если есть
  const weightSpec = specs.dimensions.find((s) =>
    s.key.toLowerCase().includes("weight")
  );
  if (weightSpec) {
    summaryParts.push(`${weightSpec.value}${weightSpec.unit || " т"}`);
  }

  // Добавить объем ковша если есть
  const bucketSpec = specs.performance.find((s) =>
    s.key.toLowerCase().includes("bucket")
  );
  if (bucketSpec) {
    summaryParts.push(`${bucketSpec.value}${bucketSpec.unit || " м³"}`);
  }

  return summaryParts.join(" | ");
}
