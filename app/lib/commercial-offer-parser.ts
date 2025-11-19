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

// Расширенные паттерны для лучшего покрытия
const patterns = {
  price: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+)\s*руб/i,
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке)/i,
  lease: /(?:лизинг|аренда|рассрочк)/i,
  paymentType: /(?:безналичн|нал\s*\/\s*безнал|перевод|карт)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран)/i,
  year: /(?:год|г\.в\.)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+)\s*км/i
} as const;

// Популярные бренды для лучшего определения
const COMMON_BRANDS = ['volvo', 'scania', 'man', 'daf', 'renault', 'iveco', 'mercedes', 'kamaz'];

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== 'я');

  // Извлечение названия и типа техники
  extractTitleAndEquipment(data, lines, normalizedText);
  
  // Извлечение цены и условий
  extractPricingAndConditions(data, normalizedText);
  
  // Извлечение характеристик
  extractSpecifications(data, text, lines);

  return data;
}

function extractTitleAndEquipment(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск оборудования
  const equipmentMatch = normalizedText.match(patterns.equipment);
  if (equipmentMatch) {
    data.equipment = equipmentMatch[0];
  }

  // Поиск заголовка - сначала ищем строку с брендом
  const brandLine = lines.find(line => 
    COMMON_BRANDS.some(brand => line.toLowerCase().includes(brand))
  );
  
  if (brandLine) {
    data.title = brandLine.trim();
    
    // Пытаемся извлечь модель
    const modelMatch = data.title.match(/(volvo|scania|man|daf|renault|iveco|mercedes|kamaz)\s+([a-z0-9\s]+)/i);
    if (modelMatch) {
      data.model = modelMatch[2].trim();
    }
  } else if (lines.length > 0) {
    // Используем первую строку как заголовок
    data.title = lines[0].trim();
  }

  // Добавляем оборудование к заголовку если нужно
  if (data.equipment && data.title && !data.title.toLowerCase().includes(data.equipment.toLowerCase())) {
    data.title = `${data.equipment} ${data.title}`;
  }
}

function extractPricingAndConditions(data: CommercialOfferData, normalizedText: string) {
  // Извлечение цены
  const priceMatch = normalizedText.match(patterns.price);
  if (priceMatch) {
    const priceStr = priceMatch[1].replace(/\s/g, '');
    if (priceStr && priceStr !== '1') { // Игнорируем цену 1 рубль
      data.price = parseInt(priceStr);
    }
  }

  // Альтернативный поиск цены
  if (!data.price) {
    const altPriceMatch = normalizedText.match(/([\d\s]+)\s*руб(?!.*пробег)/i);
    if (altPriceMatch) {
      const priceStr = altPriceMatch[1].replace(/\s/g, '');
      if (priceStr && priceStr !== '1') {
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

function extractSpecifications(data: CommercialOfferData, text: string, lines: string[]) {
  const specs: Record<string, string> = {};
  
  // 1. Парсинг характеристик через regex (как в оригинальном коде)
  const specRegex = /([а-яё\s]+):\s*([^\n:]+)(?=\n|$)/gi;
  let match;
  
  while ((match = specRegex.exec(text)) !== null) {
    const key = match[1].trim();
    const value = match[2].trim();
    
    if (isValidSpec(key) && isValidValue(value)) {
      specs[key] = value;
    }
  }

  // 2. Дополнительный парсинг для табличных данных
  for (const line of lines) {
    // Обработка строк с разделителями типа "Марка | VOLVO"
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts[1];
        if (isValidSpec(key) && isValidValue(value) && !specs[key]) {
          specs[key] = value;
        }
        
        // Обработка пар в одной строке "Ключ | Значение | Ключ2 | Значение2"
        if (parts.length >= 4) {
          for (let i = 0; i < parts.length; i += 2) {
            if (i + 1 < parts.length) {
              const tableKey = parts[i];
              const tableValue = parts[i + 1];
              if (isValidSpec(tableKey) && isValidValue(tableValue) && !specs[tableKey]) {
                specs[tableKey] = tableValue;
              }
            }
          }
        }
      }
    }
  }

  // 3. Извлечение года и пробега через отдельные паттерны
  const yearMatch = text.match(patterns.year);
  if (yearMatch && !specs['Год выпуска']) {
    specs['Год выпуска'] = yearMatch[1];
  }

  const mileageMatch = text.match(patterns.mileage);
  if (mileageMatch && !specs['Пробег']) {
    specs['Пробег'] = mileageMatch[1].replace(/\s/g, '') + ' км';
  }

  data.specifications = specs;
}

function isValidSpec(key: string): boolean {
  if (!key || key.length < 2 || key.length > 50) return false;
  if (key.match(/^\d+$/)) return false; // Только цифры
  if (!key.match(/[а-яёa-z]/i)) return false; // Должны быть буквы
  
  const invalidKeys = [
    'я', 'коммерческое', 'предложение', 'стоимость', 'цена',
    'руб', 'характеристики', 'техника', 'описание'
  ];
  
  const lowerKey = key.toLowerCase();
  return !invalidKeys.some(invalid => lowerKey.includes(invalid));
}

function isValidValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 100) return false;
  if (value.toLowerCase().includes('характеристики')) return false;
  if (value.toLowerCase().includes('техники')) return false;
  if (value === 'я') return false;
  
  return true;
}

export function formatSpecsForTable(specs: Record<string, string>): Array<[string, string][]> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  // Сортируем характеристики для лучшего отображения
  const priorityKeys = ['Марка', 'Модель', 'Год выпуска', 'Пробег', 'Двигатель', 'Мощность'];
  
  const entries = Object.entries(specs)
    .filter(([k, v]) => k && v && k.trim() && v.trim())
    .sort(([keyA], [keyB]) => {
      const indexA = priorityKeys.indexOf(keyA);
      const indexB = priorityKeys.indexOf(keyB);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return keyA.localeCompare(keyB);
    });

  const rows: Array<[string, string][]> = [];
  
  // Создаем строки по 2 колонки
  for (let i = 0; i < entries.length; i += 2) {
    const row: [string, string][] = [entries[i]];
    if (i + 1 < entries.length) {
      row.push(entries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}
