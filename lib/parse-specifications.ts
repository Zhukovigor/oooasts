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
    "габариты": "Габариты",
    "размеры": "Габариты",
    "двигатель": "Двигатель",
    "мотор": "Двигатель",
    "шасси": "Шасси",
    "ходовая часть": "Ходовая часть",
    "ходовая": "Ходовая часть",
    "подвеска": "Подвеска",
    "весовые показатели": "Весовые показатели",
    "весовые параметры": "Весовые показатели",
    "вес": "Весовые показатели",
    "рабочие параметры": "Рабочие характеристики",
    "рабочие характеристики": "Рабочие характеристики",
    "технические характеристики": "Рабочие характеристики",
    "крановое оборудование": "Крановое оборудование",
    "кран-манипулятор": "Крановое оборудование",
    "кран": "Крановое оборудование",
    "гидравлическая система": "Гидравлика",
    "гидравлика": "Гидравлика",
    "гидросистема": "Гидравлика",
    "трансмиссия": "Трансмиссия",
    "коробка": "Трансмиссия",
    "дополнительные характеристики": "Прочее",
    "дополнительно": "Прочее",
    "прочее": "Прочее",
    "основные параметры": "Основные параметры",
    "основные": "Основные параметры",
  };

  // Предварительная обработка текста
  let processedText = text
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Удаляем лишние заголовки
  processedText = processedText
    .replace(/^Извлеченные характеристики:\s*/i, "")
    .replace(/Применить к форме$/i, "")
    .trim();

  // Сначала исправляем общий порядок единиц измерения во всем тексте
  processedText = fixUnitOrderInText(processedText);

  // Разбиваем на предложения, сохраняя структуру
  const sentences = processedText.split(/(?<=[\.\d])\s+(?=[А-ЯA-Z])/);

  let currentCategory: keyof ParsedSpecifications = "Прочее";

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    const cleanSentence = sentence.trim();
    
    // Определяем категорию по ключевым словам
    const lowerSentence = cleanSentence.toLowerCase();
    
    // Проверяем, не является ли предложение заголовком категории
    if (lowerSentence === "прочее" || lowerSentence === "описание") {
      currentCategory = "Прочее";
      continue;
    }

    // Автоматически определяем категорию по содержимому
    if (lowerSentence.includes("двигатель") || lowerSentence.includes("мощность") || (lowerSentence.includes("объем") && lowerSentence.includes("л"))) {
      currentCategory = "Двигатель";
    } else if (lowerSentence.includes("шасси") || lowerSentence.includes("модель:") || lowerSentence.includes("максимальная скорость")) {
      currentCategory = "Шасси";
    } else if (lowerSentence.includes("ходовая часть") || lowerSentence.includes("колесная") || lowerSentence.includes("шины")) {
      currentCategory = "Ходовая часть";
    } else if (lowerSentence.includes("подвеска") || lowerSentence.includes("рессор")) {
      currentCategory = "Подвеска";
    } else if (lowerSentence.includes("масса") || lowerSentence.includes("нагрузка") || lowerSentence.includes("кг")) {
      currentCategory = "Весовые показатели";
    } else if (lowerSentence.includes("кран") || lowerSentence.includes("стрел") || lowerSentence.includes("грузоподъемность")) {
      currentCategory = "Крановое оборудование";
    } else if (lowerSentence.includes("гидравлическ") || lowerSentence.includes("гидробак") || lowerSentence.includes("мпа")) {
      currentCategory = "Гидравлика";
    } else if (lowerSentence.includes("трансмиссия") || lowerSentence.includes("привод")) {
      currentCategory = "Трансмиссия";
    } else if (lowerSentence.includes("габарит") || lowerSentence.includes("размер") || lowerSentence.includes("мм") || lowerSentence.includes("высота") || lowerSentence.includes("ширина") || lowerSentence.includes("длина")) {
      currentCategory = "Габариты";
    }

    // Парсим отдельные пары ключ-значение внутри предложения
    parseComplexSentence(cleanSentence, currentCategory, result);
  }

  return result;
}

function fixUnitOrderInText(text: string): string {
  // Исправляем порядок "единица Ключ: значение" на "Ключ: значение единица"
  return text.replace(
    /(\b(?:мм|см|м|км|кг|т|л|кВт|л\.с\.|об\/мин|°|°C|МПа)\b)\s+([А-Яа-яA-Za-z\s]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g,
    '$2: $3 $1'
  );
}

function parseComplexSentence(sentence: string, category: keyof ParsedSpecifications, result: ParsedSpecifications): void {
  // Разные паттерны для извлечения данных
  const patterns = [
    // Паттерн для "Ключ: значение"
    /([^:]+?):\s*([^:]+?)(?=\s+[^:]+?:|$)/g,
  ];

  for (const pattern of patterns) {
    const matches = [...sentence.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[2]) {
        let key = match[1].trim();
        let value = match[2].trim();

        // Очистка ключа
        key = key.replace(/[•·\-—\d]/g, "").trim();
        
        // Пропускаем слишком короткие ключи или числовые значения
        if (key.length < 2 || /^\d+$/.test(key)) continue;

        // Очистка значения
        value = value.replace(/^[•·\-—\s,]+/, "").trim();

        if (value && !value.endsWith(":")) {
          result[category][key] = value;
        }
      }
    }
  }

  // Специальная обработка для габаритных размеров
  if (sentence.includes("×") || sentence.includes("x") || sentence.includes("*")) {
    const sizeMatch = sentence.match(/(\d+)\s*[×x*]\s*(\d+)\s*[×x*]\s*(\d+)\s*мм/);
    if (sizeMatch) {
      result["Габариты"]["Размеры кузова"] = `${sizeMatch[1]} × ${sizeMatch[2]} × ${sizeMatch[3]} мм`;
    }
  }
}
