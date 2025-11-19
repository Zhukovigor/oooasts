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
  photoUrl?: string;
}

// Расширенные паттерны для лучшего покрытия
const patterns = {
  title: /(?:КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ|КОРПЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ)[\s\S]*?([^\n]+(?:\n[^\n]+){0,2})/i,
  price: /(?:стоимость|цена)[^:\d]*:?\s*([\d\s]+(?:\s?руб)?)/i,
  priceExact: /([\d\s]{4,})\s*руб/i,
  priceWithVat: /(?:с\s*ндс|ндс\s*включен|цена\s*с\s*ндс|стоимость\s*с\s*ндс)/i,
  availability: /(?:в\s*наличии|доступн|готов\s*к\s*отгрузке)/i,
  lease: /(?:лизинг|аренда|рассрочк)/i,
  paymentType: /(?:безналичн|нал\s*\/\s*безнал|перевод|карт)/i,
  diagnostics: /(?:диагностика\s*пройдена|проверен|тех\s*осмотр)/i,
  equipment: /(?:седельный\s*тягач|экскаватор|погрузчик|бетонораспределитель|самосвал|кран)/i,
  year: /(?:год|г\.?в?\.?)[^:\d]*:?\s*(\d{4})/i,
  mileage: /(?:пробег|километраж)[^:\d]*:?\s*([\d\s]+)\s*км/i,
  photoUrl: /(https?:\/\/[^\s]+)/i
} as const;

const COMMON_BRANDS = ['volvo', 'scania', 'man', 'daf', 'renault', 'iveco', 'mercedes', 'kamaz'];
const COMMON_SPECS = [
  'год выпуска', 'пробег', 'тип кабины', 'двигатель', 'мощность двигателя', 
  'вид топлива', 'колесная формула', 'тип подвески', 'тормоза', 'тип кпп',
  'марка', 'модель', 'кабина', 'топливо', 'мощность', 'подвеска', 'кпп'
];

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
  };

  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase().trim();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== 'я' && l.length > 1);

  // Извлечение всех данных
  extractTitleAndEquipment(data, lines, normalizedText);
  extractPricingAndConditions(data, normalizedText, text);
  extractSpecifications(data, text, lines);
  extractPhotoUrl(data, text);

  // Валидация обязательных полей для сохранения в БД
  validateRequiredFields(data);

  return data;
}

function extractTitleAndEquipment(data: CommercialOfferData, lines: string[], normalizedText: string) {
  // Поиск в заголовке
  const titleMatch = normalizedText.match(patterns.title);
  if (titleMatch && titleMatch[1]) {
    data.title = titleMatch[1].trim();
  }

  // Поиск оборудования
  const equipmentMatch = normalizedText.match(patterns.equipment);
  if (equipmentMatch) {
    data.equipment = equipmentMatch[0];
  }

  // Поиск по брендам в строках
  const brandLine = lines.find(line => 
    COMMON_BRANDS.some(brand => line.toLowerCase().includes(brand))
  );
  
  if (brandLine && !data.title) {
    data.title = brandLine.trim();
  }

  // Извлечение модели из заголовка
  if (data.title) {
    const modelMatch = data.title.match(/(volvo|scania|man|daf|renault|iveco|mercedes|kamaz)\s+([a-z0-9\s\-]+)/i);
    if (modelMatch) {
      data.model = modelMatch[2].trim();
    }
  }

  // Если заголовка нет, используем первую значимую строку
  if (!data.title && lines.length > 0) {
    data.title = lines.find(line => line.length > 5 && !line.includes('---')) || lines[0];
  }
}

function extractPricingAndConditions(data: CommercialOfferData, normalizedText: string, originalText: string) {
  // Извлечение цены - сначала точный поиск
  const priceExactMatch = originalText.match(patterns.priceExact);
  if (priceExactMatch) {
    const priceStr = priceExactMatch[1].replace(/\s/g, '');
    if (priceStr && priceStr !== '1' && parseInt(priceStr) > 1000) {
      data.price = parseInt(priceStr);
    }
  }

  // Если точный поиск не сработал, используем общий паттерн
  if (!data.price) {
    const priceMatch = normalizedText.match(patterns.price);
    if (priceMatch && priceMatch[1]) {
      const priceStr = priceMatch[1].replace(/\s/g, '');
      if (priceStr && priceStr !== '1' && parseInt(priceStr) > 1000) {
        data.price = parseInt(priceStr);
      }
    }
  }

  // Условия покупки
  data.priceWithVat = patterns.priceWithVat.test(normalizedText);
  data.vatIncluded = data.priceWithVat;
  
  if (patterns.availability.test(normalizedText)) {
    data.availability = 'В наличии';
  }
  
  data.lease = patterns.lease.test(normalizedText);
  
  if (patterns.paymentType.test(normalizedText)) {
    data.paymentType = 'Безналичная оплата с НДС';
  }
  
  data.diagnosticsPassed = patterns.diagnostics.test(normalizedText);
}

function extractSpecifications(data: CommercialOfferData, text: string, lines: string[]) {
  const specs: Record<string, string> = {};
  
  // 1. Парсинг характеристик через regex
  const specRegex = /([а-яё\s\-]+):\s*([^\n:]+)(?=\n|$)/gi;
  let match;
  
  while ((match = specRegex.exec(text)) !== null) {
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    
    if (isValidSpec(key) && isValidValue(value)) {
      const normalizedKey = normalizeSpecKey(key);
      specs[normalizedKey] = value;
    }
  }

  // 2. Парсинг табличных данных
  for (const line of lines) {
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      
      if (parts.length === 2) {
        const key = parts[0].toLowerCase();
        const value = parts[1];
        if (isValidSpec(key) && isValidValue(value)) {
          const normalizedKey = normalizeSpecKey(key);
          if (!specs[normalizedKey]) {
            specs[normalizedKey] = value;
          }
        }
      }
      
      // Обработка пар ключ-значение в одной строке
      if (parts.length >= 4) {
        for (let i = 0; i < parts.length; i += 2) {
          if (i + 1 < parts.length) {
            const key = parts[i].toLowerCase();
            const value = parts[i + 1];
            if (isValidSpec(key) && isValidValue(value)) {
              const normalizedKey = normalizeSpecKey(key);
              if (!specs[normalizedKey]) {
                specs[normalizedKey] = value;
              }
            }
          }
        }
      }
    }
  }

  // 3. Извлечение специфических характеристик
  const yearMatch = text.match(patterns.year);
  if (yearMatch && yearMatch[1]) {
    specs['Год выпуска'] = yearMatch[1];
  }

  const mileageMatch = text.match(patterns.mileage);
  if (mileageMatch && mileageMatch[1]) {
    specs['Пробег'] = mileageMatch[1].replace(/\s/g, '') + ' км';
  }

  // 4. Дополнительный поиск в строках
  for (const line of lines) {
    for (const spec of COMMON_SPECS) {
      if (line.toLowerCase().includes(spec) && !specs[normalizeSpecKey(spec)]) {
        const value = extractValueAfterColon(line, spec);
        if (value && isValidValue(value)) {
          specs[normalizeSpecKey(spec)] = value;
        }
      }
    }
  }

  data.specifications = specs;
}

function extractPhotoUrl(data: CommercialOfferData, text: string) {
  const urlMatch = text.match(patterns.photoUrl);
  if (urlMatch && urlMatch[1].includes('http')) {
    data.photoUrl = urlMatch[1];
  }
}

function extractValueAfterColon(line: string, key: string): string | null {
  const lowerLine = line.toLowerCase();
  const keyIndex = lowerLine.indexOf(key);
  if (keyIndex !== -1) {
    const afterKey = line.substring(keyIndex + key.length);
    const colonIndex = afterKey.indexOf(':');
    if (colonIndex !== -1) {
      return afterKey.substring(colonIndex + 1).trim();
    }
  }
  return null;
}

function normalizeSpecKey(key: string): string {
  const keyMap: Record<string, string> = {
    'год': 'Год выпуска',
    'пробег': 'Пробег',
    'кабина': 'Тип кабины',
    'двигатель': 'Двигатель',
    'мощность': 'Мощность двигателя',
    'топливо': 'Вид топлива',
    'колесная формула': 'Колесная формула',
    'подвеска': 'Тип подвески',
    'тормоза': 'Тормоза',
    'кпп': 'Тип КПП',
    'марка': 'Марка',
    'модель': 'Модель'
  };
  
  const normalized = key.toLowerCase().trim();
  return keyMap[normalized] || key.charAt(0).toUpperCase() + key.slice(1);
}

function isValidSpec(key: string): boolean {
  if (!key || key.length < 2 || key.length > 50) return false;
  if (key.match(/^\d+$/)) return false;
  if (!key.match(/[а-яёa-z]/i)) return false;
  
  const invalidKeys = [
    'я', 'коммерческое', 'предложение', 'стоимость', 'цена',
    'руб', 'характеристики', 'техника', 'описание', 'сохранить',
    'опубликовать', 'предпросмотр'
  ];
  
  const lowerKey = key.toLowerCase();
  return !invalidKeys.some(invalid => lowerKey.includes(invalid));
}

function isValidValue(value: string): boolean {
  if (!value || value.length < 1 || value.length > 100) return false;
  if (value.toLowerCase().includes('характеристики')) return false;
  if (value.toLowerCase().includes('техники')) return false;
  if (value === 'я') return false;
  if (value.match(/^[\.\,\-\s]+$/)) return false;
  
  return true;
}

function validateRequiredFields(data: CommercialOfferData): void {
  // Добавляем обязательные поля, если они отсутствуют
  if (!data.title && data.equipment && data.model) {
    data.title = `${data.equipment} ${data.model}`;
  }
  
  if (!data.specifications) {
    data.specifications = {};
  }
}

export function formatSpecsForTable(specs: Record<string, string>): Array<[string, string][]> {
  if (!specs || Object.keys(specs).length === 0) {
    return [];
  }

  const priorityKeys = ['Марка', 'Модель', 'Год выпуска', 'Пробег', 'Двигатель', 'Мощность двигателя'];
  
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
  
  for (let i = 0; i < entries.length; i += 2) {
    const row: [string, string][] = [entries[i]];
    if (i + 1 < entries.length) {
      row.push(entries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}

// Функция для проверки готовности данных к сохранению в БД
export function isDataReadyForSave(data: CommercialOfferData): boolean {
  return !!(data.title && data.price && data.specifications && Object.keys(data.specifications).length > 0);
}
