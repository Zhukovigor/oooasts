export interface ParsedSpecifications {
  "Основные параметры": Record<string, string>;
  Двигатель: Record<string, string>;
  Гидравлика: Record<string, string>;
  Габариты: Record<string, string>;
  "Рабочие характеристики": Record<string, string>;
  Шасси: Record<string, string>;
  "Ходовая часть": Record<string, string>;
  Подвеска: Record<string, string>;
  "Весовые показатели": Record<string, string>;
  "Крановое оборудование": Record<string, string>;
  Трансмиссия: Record<string, string>;
  Прочее: Record<string, string>;
}

export function parseSpecificationsFromText(text: string): ParsedSpecifications {
  const result: ParsedSpecifications = {
    "Основные параметры": {},
    Двигатель: {},
    Гидравлика: {},
    Габариты: {},
    "Рабочие характеристики": {},
    Шасси: {},
    "Ходовая часть": {},
    Подвеска: {},
    "Весовые показатели": {},
    "Крановое оборудование": {},
    Трансмиссия: {},
    Прочее: {},
  };

  const sectionMapping: Record<string, keyof ParsedSpecifications> = {
    "габаритные параметры": "Габариты",
    "габаритные размеры": "Габариты",
    габариты: "Габариты",
    размеры: "Габариты",
    двигатель: "Двигатель",
    мотор: "Двигатель",
    шасси: "Шасси",
    "ходовая часть": "Ходовая часть",
    ходовая: "Ходовая часть",
    подвеска: "Подвеска",
    "весовые показатели": "Весовые показатели",
    "весовые параметры": "Весовые показатели",
    вес: "Весовые показатели",
    "рабочие параметры": "Рабочие характеристики",
    "рабочие характеристики": "Рабочие характеристики",
    "технические характеристики": "Рабочие характеристики",
    "крановое оборудование": "Крановое оборудование",
    "кран-манипулятор": "Крановое оборудование",
    кран: "Крановое оборудование",
    "гидравлическая система": "Гидравлика",
    гидравлика: "Гидравлика",
    гидросистема: "Гидравлика",
    трансмиссия: "Трансмиссия",
    коробка: "Трансмиссия",
    "дополнительные характеристики": "Прочее",
    дополнительно: "Прочее",
    прочее: "Прочее",
    "основные параметры": "Основные параметры",
    основные: "Основные параметры",
  };

  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ");

  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let currentCategory: keyof ParsedSpecifications = "Прочее";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const lowerLine = line.toLowerCase().trim();
    
    // Обработка заголовков разделов
    if (lowerLine.startsWith("## ") || lowerLine.startsWith("# ")) {
      const sectionName = lowerLine.replace(/^#+\s*/, "").trim();
      let foundSection = false;

      for (const [sectionKey, category] of Object.entries(sectionMapping)) {
        if (sectionName.includes(sectionKey) || sectionKey.includes(sectionName)) {
          currentCategory = category;
          foundSection = true;
          break;
        }
      }
      
      if (!foundSection && sectionName === "рабочие характеристики") {
        currentCategory = "Рабочие характеристики";
        foundSection = true;
      }
      
      continue;
    }

    // Пропускаем разделители
    if (line.startsWith("---") || line.startsWith("***") || line.startsWith("___")) {
      continue;
    }

    // Обработка маркированных списков (bullet points)
    if (line.match(/^[\s]*[-•·*][\s]+/)) {
      const bulletContent = line.replace(/^[\s]*[-•·*][\s]+/, "").trim();
      parseKeyValuePair(bulletContent, currentCategory, result);
      continue;
    }

    // Обработка таблиц (строки с | разделителями)
    if (line.includes("|") && !line.startsWith("|--")) {
      const tableCells = line.split("|").map(cell => cell.trim()).filter(cell => cell);
      if (tableCells.length >= 2) {
        const key = tableCells[0];
        const value = tableCells.slice(1).join(" | ");
        if (key && value && !key.match(/^-+$/)) {
          result[currentCategory][key] = value;
        }
      }
      continue;
    }

    // Стандартная обработка пар ключ-значение
    parseKeyValuePair(line, currentCategory, result);
  }

  return result;
}

// Вспомогательная функция для парсинга пар ключ-значение
function parseKeyValuePair(line: string, currentCategory: keyof ParsedSpecifications, result: ParsedSpecifications): void {
  const patterns = [
    /^([^:：\-—]+?)[\s]*[:：][\s]*(.+)$/, // Colon separator
    /^([^:：\-—]+?)[\s]*[-—][\s]*(.+)$/, // Dash separator
    /^([^:：\-—]+?)[\s]{2,}(.+)$/, // Multiple spaces separator
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();

      key = key.replace(/[•·\-—]/g, "").trim();
      value = value.replace(/^[•·\-—\s]+/, "").trim();

      if (key.length > 1 && value.length > 0) {
        result[currentCategory][key] = value;
        return;
      }
    }
  }

  // Для строк без явных разделителей, но с содержательными данными
  if (line.includes(" ") && !line.endsWith(":")) {
    const parts = line.split(/\s{2,}|(?<=\D)\s+(?=\d)/);
    if (parts.length >= 2) {
      const key = parts[0].trim().replace(/[•·\-—]/g, "").trim();
      const value = parts.slice(1).join(" ").trim();
      if (key.length > 1 && value.length > 0 && !key.match(/^[\d\s]+$/)) {
        result[currentCategory][key] = value;
      }
    }
  }
}

export function convertParsedToJSON(parsed: ParsedSpecifications): Record<string, any> {
  const json: Record<string, any> = {};

  Object.entries(parsed).forEach(([category, specs]) => {
    if (Object.keys(specs).length > 0) {
      json[category] = specs;
    }
  });

  return json;
}
