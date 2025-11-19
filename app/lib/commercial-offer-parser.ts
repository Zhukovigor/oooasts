// lib/parsers/commercial-offer-parser.ts

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
  currency?: string;
}

export function parseCommercialOfferText(text: string): CommercialOfferData {
  const data: CommercialOfferData = {
    specifications: {},
    currency: "RUB"
  };

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Поиск заголовка и оборудования
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('коммерческое предложение') || line.includes('предложение')) {
      if (i + 1 < lines.length) {
        data.title = lines[i + 1];
      }
    }
    if (line.includes('тягач') || line.includes('экскаватор') || line.includes('погрузчик') || line.includes('техника')) {
      data.equipment = lines[i];
    }
  }

  // Парсинг цены
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Поиск стоимости
    if (lowerLine.includes('стоимость') && (lowerLine.includes('руб') || lowerLine.includes('руб.'))) {
      const priceMatch = line.match(/(\d[\d\s]*)\s*руб/i);
      if (priceMatch) {
        data.price = parseInt(priceMatch[1].replace(/\s/g, ''));
      }
    }
    
    // Условия
    if (lowerLine.includes('с ндс') || lowerLine.includes('сндс')) data.priceWithVat = true;
    if (lowerLine.includes('в наличии')) data.availability = 'В наличии';
    if (lowerLine.includes('лизинг')) data.lease = true;
    if (lowerLine.includes('безналичная')) data.paymentType = 'Безналичная оплата';
    if (lowerLine.includes('диагностика пройдена')) data.diagnosticsPassed = true;
    if (lowerLine.includes('ндс')) data.vatIncluded = true;
  }

  // Парсинг характеристик - ищем таблицу или список характеристик
  let inSpecsSection = false;
  const specs: Record<string, string> = {};

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Начало секции характеристик
    if (lowerLine.includes('технические') || lowerLine.includes('характеристики') || lowerLine.includes('параметры')) {
      inSpecsSection = true;
      continue;
    }
    
    // Конец секции характеристик
    if (inSpecsSection && (line.includes('---') || line.includes('___') || line.length === 0)) {
      inSpecsSection = false;
      continue;
    }
    
    if (inSpecsSection) {
      // Парсим строки типа "Ключ: Значение"
      const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (colonMatch) {
        const key = colonMatch[1].trim();
        const value = colonMatch[2].trim();
        if (key && value && key.length < 50 && value.length < 100) {
          specs[key] = value;
        }
      }
      
      // Парсим табличные данные
      const pipeMatch = line.match(/^\|?\s*([^|]+)\s*\|\s*([^|]+)\s*\|?$/);
      if (pipeMatch && !line.includes('---') && !line.includes('===')) {
        const key = pipeMatch[1].trim();
        const value = pipeMatch[2].trim();
        if (key && value && !key.includes('---') && !value.includes('---')) {
          specs[key] = value;
        }
      }
    }
  }

  data.specifications = specs;

  // Автоматическое определение модели из заголовка
  if (!data.model && data.title) {
    const modelMatch = data.title.match(/(volvo|kamaz|man|scania|renault)\s+([a-z0-9\s]+)/i);
    if (modelMatch) {
      data.model = modelMatch[0];
    }
  }

  return data;
}

export function formatSpecsForTable(specs: Record<string, string>): Array<[string, string][]> {
  const entries = Object.entries(specs);
  const rows: Array<[string, string][]> = [];
  
  for (let i = 0; i < entries.length; i += 2) {
    const row: [string, string][] = [];
    row.push(entries[i]);
    if (i + 1 < entries.length) {
      row.push(entries[i + 1]);
    }
    rows.push(row);
  }
  
  return rows;
}
