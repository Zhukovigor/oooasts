// specs-parser.ts
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { convert as htmlToText } from "html-to-text";
import { JSDOM } from "jsdom";

export interface ParsedSpec {
  category: string;
  key: string;
  value: string;
  unit?: string;
  rawText: string;
}

const SPEC_CATEGORIES: Record<string, string[]> = {
  "Двигатель": [
    "двигатель", "мощность", "производитель", "модель", "крутящий момент", "цилиндр",
    "обороты", "топливо", "дизель", "rpm", "л.с.", "квт", "кВт", "н·м", "нм", "объем", "стандарт"
  ],
  "Размеры": [
    "длина", "ширина", "высота", "габарит", "размер", "клиренс",
    "дорожный просвет", "масса", "вес", "мм", "см", "м", "кг", "тонн", "тоннн"
  ],
  "Производительность": [
    "емкость", "ковш", "грузоподъемность", "объем", "глубина копания",
    "дальность выгрузки", "вырывное усилие", "усилие копания", "м³", "м3", "литр", "л", "м"
  ],
  "Гидравлическая система": [
    "гидравлика", "насос", "давление", "производительность", "расход",
    "гидросистема", "бар", "л/мин", "лмин", "мпа", "кг/см", "мл/мин"
  ],
  "Ходовые характеристики": [
    "ходовые", "скорость", "тяговое усилие", "подъем", "км/ч", "преодолеваемый", "уклон"
  ],
  "Трансмиссия": [
    "коробка", "передача", "привод", "трансмиссия", "акпп", "мкпп"
  ],
  "Емкости": [
    "топливный бак", "бак", "емкость", "топливо", "масло", "охлаждение", "литр", "л"
  ],
  "Режимы работы": [
    "режим", "эконом", "экономичный", "мощност", "heavy lift", "уровень"
  ],
  "Общие": ["производитель", "модель", "назначение", "тип", "серия"]
};

// ------------- TEXT EXTRACTION: PDF / DOCX / HTML / TXT -------------
export async function extractTextFromFile(filePath: string): Promise<{ text: string; mime: string | null }> {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const buffer = await fs.readFile(filePath);

  if (["pdf"].includes(ext)) {
    // PDF
    try {
      const data = await pdfParse(buffer);
      const text = (data && data.text) ? data.text : "";
      return { text: sanitizeExtractedText(text), mime: "application/pdf" };
    } catch (e) {
      throw new Error("Ошибка чтения PDF: " + String(e));
    }
  }

  if (["docx", "doc"].includes(ext)) {
    // DOCX via mammoth (DOC may not be supported; for .doc use external converter)
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return { text: sanitizeExtractedText(value), mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    } catch (e) {
      throw new Error("Ошибка чтения DOCX: " + String(e));
    }
  }

  if (["html", "htm"].includes(ext)) {
    // HTML: strip tags and keep structure
    try {
      const raw = buffer.toString("utf8");
      // small DOM processing to keep text of tables / lists
      const dom = new JSDOM(raw);
      const doc = dom.window.document;
      // Convert tables to text rows to preserve key-value pairs
      const tables = Array.from(doc.querySelectorAll("table"));
      for (const t of tables) {
        // Replace table with plain-text representation
        const rows = Array.from(t.querySelectorAll("tr")).map(tr =>
          Array.from(tr.querySelectorAll("td,th")).map(td => td.textContent?.trim() ?? "").join(" | ")
        ).join("\n");
        const pre = doc.createElement("pre");
        pre.textContent = rows;
        t.replaceWith(pre);
      }
      const text = htmlToText(dom.serialize(), {
        wordwrap: 130,
        selectors: [{ selector: "a", options: { ignoreHref: true } }]
      });
      return { text: sanitizeExtractedText(text), mime: "text/html" };
    } catch (e) {
      throw new Error("Ошибка чтения HTML: " + String(e));
    }
  }

  if (["txt", "text", "md", "markdown"].includes(ext)) {
    return { text: sanitizeExtractedText(buffer.toString("utf8")), mime: "text/plain" };
  }

  // Image or unknown binary — cannot extract text without OCR
  const imageExts = ["png", "jpg", "jpeg", "gif", "bmp", "tiff", "webp"];
  if (imageExts.includes(ext)) {
    return { text: "", mime: "image/*" };
  }

  // Fallback: try to decode as utf8
  try {
    return { text: sanitizeExtractedText(buffer.toString("utf8")), mime: null };
  } catch {
    return { text: "", mime: null };
  }
}

function sanitizeExtractedText(t: string): string {
  // Normalize line endings, remove repeated empty lines, trim spaces
  return t
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .split("\n")
    .map(line => line.trim())
    .filter((line, idx, arr) => !(line === "" && (arr[idx - 1] === "")))
    .join("\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

// ---------------- SPEC PARSER (улучшенный) ----------------
export function parseSpecificationsFromText(text: string): ParsedSpec[] {
  if (!text || !text.trim()) return [];

  const specs: ParsedSpec[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const processedKeys = new Set<string>();
  let currentCategory = "Общие";

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Skip very short garbage lines
    if (line.length < 2) continue;

    // Detect category header
    const detectedCategory = detectCategoryFromLine(line);
    if (detectedCategory) {
      currentCategory = detectedCategory;
      continue;
    }

    // Try parsing several patterns in order of reliability
    const parsed =
      parseTableRowLike(line) ||
      parseColonOrDashSeparated(line) ||
      parseKeyNumberUnit(line) ||
      parseKeyValueInline(line);

    if (!parsed) {
      // Try to join with next line if pattern broken across lines: "Ключ\nЗначение"
      if (i + 1 < lines.length && /^[\d.,]/.test(lines[i + 1])) {
        const maybeValue = lines[i + 1];
        const spec = createSpec(currentCategory, line, maybeValue, `${line}\n${maybeValue}`, undefined);
        if (spec) {
          const id = `${spec.category}_${spec.key}`;
          if (!processedKeys.has(id)) {
            specs.push(spec);
            processedKeys.add(id);
            i++; // consumed next line
            continue;
          }
        }
      }
      continue;
    }

    const spec = createSpec(currentCategory, parsed.key, parsed.value, line, parsed.unit);
    if (!spec) continue;
    const id = `${spec.category}_${spec.key}`;
    if (!processedKeys.has(id)) {
      specs.push(spec);
      processedKeys.add(id);
    } else {
      // If duplicate — maybe update existing if value is better
      const existingIndex = specs.findIndex(s => `${s.category}_${s.key}` === id);
      if (existingIndex >= 0) {
        if (isBetterSpec(spec, specs[existingIndex])) {
          specs[existingIndex] = spec;
        }
      }
    }
  }

  return mergeDuplicateSpecs(specs);
}

// ---------------- PARSING HELPERS ----------------
function detectCategoryFromLine(line: string): string | null {
  const l = line.toLowerCase().replace(/[=#\-\s]+/g, " ");
  // If line looks like header (short and contains keyword)
  for (const [category, keys] of Object.entries(SPEC_CATEGORIES)) {
    if (keys.some(k => l.includes(k.toLowerCase())) && line.length < 100 && !line.includes(":")) {
      return category;
    }
  }
  // Titles like "Характеристики", "Технические характеристики"
  if (/характеристик/i.test(line) || /specifications/i.test(line)) return "Общие";
  return null;
}

function parseTableRowLike(line: string): { key: string; value: string; unit?: string } | null {
  // Handles: "Ключ | Значение" and "| Ключ | Значение |" and "Ключ || Значение"
  const match = line.match(/^\|?\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|?$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  return null;
}

function parseColonOrDashSeparated(line: string): { key: string; value: string; unit?: string } | null {
  // Handles "Ключ: Значение" and "Ключ - Значение"
  const match = line.match(/^(.{2,120}?)\s*[:\-–—]\s*(.+)$/);
  if (match) {
    return { key: match[1].trim(), value: match[2].trim() };
  }
  return null;
}

function parseKeyNumberUnit(line: string): { key: string; value: string; unit?: string } | null {
  // Common patterns: "Объем ковша 1.2 м³", "Вес 21700 кг", "Скорость 12.4 об/мин"
  // Capture in the end first
  const rx = /(.{2,120}?)\s+(-?\d+[.,]?\d*(?:\s*[×x*]\s*\d+)?(?:e[+-]?\d+)?)(?:\s*([%\/°°a-zа-яА-Я²³\.µμ\/\s]+))?$/i;
  const m = line.match(rx);
  if (m) {
    const key = m[1].trim();
    const value = m[2].trim().replace(",", ".");
    const unit = m[3]?.trim();
    return { key, value, unit };
  }
  return null;
}

function parseKeyValueInline(line: string): { key: string; value: string; unit?: string } | null {
  // Fallback: try to split by multiple spaces and see if last token looks like a value
  const parts = line.split(/\s{2,}/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 2) {
    return { key: parts[0], value: parts[1] };
  }
  // Last attempt: if line contains "=" or "=>" etc.
  const eq = line.match(/^(.{2,80}?)\s*(=|=>|≈|~)\s*(.+)$/);
  if (eq) {
    return { key: eq[1].trim(), value: eq[3].trim() };
  }
  return null;
}

// ---------------- NORMALIZATION / VALIDATION ----------------
function createSpec(category: string, key: string, value: string, rawText: string, unit?: string): ParsedSpec | null {
  const normalizedKey = normalizeKey(key);
  const normalizedValue = normalizeValue(value);

  if (!isValidSpec(normalizedKey, normalizedValue)) return null;

  const finalCategory = (category && category !== "Общие")
    ? category
    : determineCategory(normalizedKey, normalizedValue, unit || "");

  const finalUnit = unit ? normalizeUnit(unit) : extractUnit(normalizedValue);

  return {
    category: finalCategory,
    key: normalizedKey,
    value: normalizedValue,
    unit: finalUnit,
    rawText: rawText.trim()
  };
}

function normalizeKey(key: string): string {
  let k = key.trim();
  // remove bullets, leading symbols, trailing colon
  k = k.replace(/^[\u2022\-\*]+\s*/, "");
  k = k.replace(/[:\-–—]+$/g, "");
  // replace multiple spaces, remove parentheses contents if they are long
  k = k.replace(/\s+/g, " ").replace(/\s*\(.*?\)\s*/g, " ").trim();
  // apply some common synonyms
  const synonyms: Record<string, string> = {
    "емкость ковша": "Объем ковша",
    "вместимость ковша": "Объем ковша",
    "грузоподъемность": "Грузоподъемность",
    "мощность": "Мощность",
    "производитель": "Производитель",
    "модель": "Модель",
    "длина": "Длина",
    "ширина": "Ширина",
    "высота": "Высота",
    "масса": "Масса",
    "вес": "Масса",
    "топливный бак": "Топливный бак",
    "объем": "Объем",
    "скорость поворота": "Скорость поворота",
    "скорость движения": "Скорость движения",
    "макс. глубина копания": "Максимальная глубина копания"
  };
  const low = k.toLowerCase();
  for (const [from, to] of Object.entries(synonyms)) {
    if (low.includes(from)) {
      return to;
    }
  }
  // Capitalize words
  return k.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function normalizeValue(val: string): string {
  return val
    .trim()
    .replace(/\u2013|\u2014/g, "-")
    .replace(/,+/g, ".")
    .replace(/\s{2,}/g, " ");
}

function normalizeUnit(u: string): string {
  return u.trim().replace(/\s+/g, " ").replace(/[,]/g, ".").toLowerCase();
}

function extractUnit(value: string): string | undefined {
  // Try to extract unit at end of value: "123 kg", "1.2 м³", "12 об/мин" etc.
  const m = value.match(/[\d\.\-]+\s*([^\d\s]+(?:[\/\s°%²³²\w]*)?)$/i);
  if (m) return normalizeUnit(m[1]);
  return undefined;
}

function isValidSpec(key: string, value: string): boolean {
  if (!key || !value) return false;
  if (key.length < 1 || key.length > 120) return false;
  // value must contain either digits or be long enough descriptive
  if (!/\d/.test(value) && value.length < 3) return false;
  const excluded = ['цена', 'стоимость', 'контакт', 'телефон', 'почта', 'авито', 'ссылка'];
  if (excluded.some(ex => key.toLowerCase().includes(ex))) return false;
  return true;
}

function determineCategory(key: string, value: string, unit: string): string {
  const lk = key.toLowerCase();
  const lu = (unit || "").toLowerCase();

  for (const [category, keywords] of Object.entries(SPEC_CATEGORIES)) {
    if (keywords.some(k => lk.includes(k.toLowerCase()))) return category;
  }

  // by unit heuristics
  if (lu.includes("квт") || lu.includes("л.с") || lu.includes("лс") || /лс|л\.с/.test(lu)) return "Двигатель";
  if (lu.includes("мм") || lu.includes("см") || lu.includes("м") || lu.includes("кг") || lu.includes("т")) return "Размеры";
  if (lu.includes("м3") || lu.includes("м³") || lu.includes("л") || lu.includes("м³")) return "Производительность";
  if (lu.includes("л/мин") || lu.includes("мпа") || lu.includes("бар")) return "Гидравлическая система";
  if (lu.includes("км/ч") || lu.includes("км")) return "Ходовые характеристики";

  return "Общие";
}

function mergeDuplicateSpecs(specs: ParsedSpec[]): ParsedSpec[] {
  const map = new Map<string, ParsedSpec>();
  for (const s of specs) {
    const id = `${s.category}::${s.key}`;
    if (!map.has(id)) {
      map.set(id, s);
      continue;
    }
    const existing = map.get(id)!;
    if (isBetterSpec(s, existing)) map.set(id, s);
  }
  return Array.from(map.values());
}

function isBetterSpec(newSpec: ParsedSpec, existingSpec: ParsedSpec): boolean {
  // Prefer those with unit
  if (newSpec.unit && !existingSpec.unit) return true;
  // Prefer longer (more informative) value
  if (newSpec.value.length > existingSpec.value.length) return true;
  // Prefer table-derived (rawText contains '|')
  if (newSpec.rawText.includes("|") && !existingSpec.rawText.includes("|")) return true;
  return false;
}

// ---------------- EXPORTers / UTIL ----------------
export function convertParsedToJSON(specs: ParsedSpec[]): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const s of specs) {
    if (!result[s.category]) result[s.category] = {};
    result[s.category][s.key] = s.unit ? `${s.value} ${s.unit}` : s.value;
  }
  return result;
}

// High-level: parse a file path and return parsed specs + raw text + mime
export async function parseFile(filePath: string) {
  const { text, mime } = await extractTextFromFile(filePath);

  if (!text) {
    // If image -> suggest OCR
    if (mime && mime.startsWith("image")) {
      return {
        error: "Файл является изображением. Для извлечения текста нужен OCR (например, tesseract.js).",
        filePath
      };
    }
    return { error: "Не удалось извлечь текст из файла", filePath, mime };
  }

  const specs = parseSpecificationsFromText(text);
  const json = convertParsedToJSON(specs);

  return { filePath, mime, rawText: text, specs, json };
}

// ---------------- TEST / EXAMPLE ----------------
if (require.main === module) {
  (async () => {
    const examplePath = "/mnt/data/b6082ce3-fe76-45e0-b7a8-95691f06c6f4.png";
    console.log("Пример: пытаемся распарсить файл:", examplePath);
    try {
      const res = await parseFile(examplePath);
      console.log("Результат:", JSON.stringify(res, null, 2));
    } catch (e) {
      console.error("Ошибка:", e);
    }
  })();
}
