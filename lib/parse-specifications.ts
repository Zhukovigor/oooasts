export interface ParsedSpecifications {
  "Основные параметры": Record<string, string>
  Двигатель: Record<string, string>
  Гидравлика: Record<string, string>
  Габариты: Record<string, string>
  "Рабочие характеристики": Record<string, string>
  Прочее: Record<string, string>
}

export function parseSpecificationsFromText(text: string): ParsedSpecifications {
  const result: ParsedSpecifications = {
    "Основные параметры": {},
    Двигатель: {},
    Гидравлика: {},
    Габариты: {},
    "Рабочие характеристики": {},
    Прочее: {},
  }

  // Разбиваем текст на строки
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  // Паттерны для извлечения характеристик
  const patterns = {
    // Основные параметры
    weight: /(?:рабочий\s+вес|масса|вес)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:кг|т|kg|ton)?/i,
    bucketVolume: /(?:объем\s+ковша|ковш)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:м³|m³|куб)/i,

    // Двигатель
    enginePower: /(?:мощность(?:\s+двигателя)?|power)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:кВт|квт|kw|л\.?с\.?|hp)?/i,
    engineModel: /(?:модель\s+двигателя|engine\s+model|двигатель)[\s:：-]*([A-Za-z0-9-]+)/i,
    engineManufacturer: /(?:производитель\s+двигателя|engine\s+manufacturer)[\s:：-]*([А-Яа-яA-Za-z\s]+)/i,

    // Гидравлика
    maxPressure:
      /(?:макс(?:имальное)?\.?\s+давление|давление|pressure)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:МПа|мпа|bar|бар)?/i,
    pumpOutput:
      /(?:производительность(?:\s+насоса)?|pump\s+output)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:м³\/ч|m³\/h|л\/мин)?/i,
    hydraulicTank: /(?:гидравлический\s+бак|hydraulic\s+tank)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:л|l)?/i,

    // Габариты
    length: /(?:длина|length)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,
    width: /(?:ширина|width)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,
    height: /(?:высота|height)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,

    // Рабочие характеристики
    maxDiggingDepth:
      /(?:макс(?:имальная)?\.?\s+глубина\s+копания|max\s+digging\s+depth)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,
    maxReach: /(?:макс(?:имальный)?\.?\s+радиус|max\s+reach)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,
    verticalReach:
      /(?:вертикальн(?:ая|ый)\s+(?:подача|вылет)|vertical\s+reach)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,
    horizontalReach:
      /(?:горизонтальн(?:ая|ый)\s+(?:подача|вылет)|horizontal\s+reach)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:мм|м|mm|m)?/i,

    // Прочее
    fuelTank: /(?:топливный\s+бак|fuel\s+tank)[\s:：-]*(\d+(?:[.,]\d+)?)\s*(?:л|l)?/i,
    chassis: /(?:шасси|chassis)[\s:：-]*([А-Яа-яA-Za-z0-9\s-]+)/i,
  }

  // Извлекаем характеристики
  const fullText = lines.join(" ")

  // Основные параметры
  const weightMatch = fullText.match(patterns.weight)
  if (weightMatch) result["Основные параметры"]["Рабочий вес"] = `${weightMatch[1]} кг`

  const bucketMatch = fullText.match(patterns.bucketVolume)
  if (bucketMatch) result["Основные параметры"]["Объем ковша"] = `${bucketMatch[1]} м³`

  // Двигатель
  const powerMatch = fullText.match(patterns.enginePower)
  if (powerMatch) result.Двигатель["Мощность"] = `${powerMatch[1]} кВт`

  const modelMatch = fullText.match(patterns.engineModel)
  if (modelMatch) result.Двигатель["Модель двигателя"] = modelMatch[1]

  const manufacturerMatch = fullText.match(patterns.engineManufacturer)
  if (manufacturerMatch) result.Двигатель["Производитель двигателя"] = manufacturerMatch[1].trim()

  // Гидравлика
  const pressureMatch = fullText.match(patterns.maxPressure)
  if (pressureMatch) result.Гидравлика["Максимальное давление"] = `${pressureMatch[1]} МПа`

  const pumpMatch = fullText.match(patterns.pumpOutput)
  if (pumpMatch) result.Гидравлика["Производительность насоса"] = `${pumpMatch[1]} м³/ч`

  const hydraulicTankMatch = fullText.match(patterns.hydraulicTank)
  if (hydraulicTankMatch) result.Гидравлика["Гидравлический бак"] = `${hydraulicTankMatch[1]} л`

  // Габариты
  const lengthMatch = fullText.match(patterns.length)
  if (lengthMatch) result.Габариты["Длина"] = `${lengthMatch[1]} мм`

  const widthMatch = fullText.match(patterns.width)
  if (widthMatch) result.Габариты["Ширина"] = `${widthMatch[1]} мм`

  const heightMatch = fullText.match(patterns.height)
  if (heightMatch) result.Габариты["Высота"] = `${heightMatch[1]} мм`

  // Рабочие характеристики
  const depthMatch = fullText.match(patterns.maxDiggingDepth)
  if (depthMatch) result["Рабочие характеристики"]["Макс. глубина копания"] = `${depthMatch[1]} м`

  const reachMatch = fullText.match(patterns.maxReach)
  if (reachMatch) result["Рабочие характеристики"]["Макс. радиус работ"] = `${reachMatch[1]} м`

  const verticalMatch = fullText.match(patterns.verticalReach)
  if (verticalMatch) result["Рабочие характеристики"]["Вертикальная подача"] = `${verticalMatch[1]} м`

  const horizontalMatch = fullText.match(patterns.horizontalReach)
  if (horizontalMatch) result["Рабочие характеристики"]["Горизонтальная подача"] = `${horizontalMatch[1]} м`

  // Прочее
  const fuelMatch = fullText.match(patterns.fuelTank)
  if (fuelMatch) result.Прочее["Топливный бак"] = `${fuelMatch[1]} л`

  const chassisMatch = fullText.match(patterns.chassis)
  if (chassisMatch) result.Прочее["Шасси"] = chassisMatch[1].trim()

  return result
}

export function convertParsedToJSON(parsed: ParsedSpecifications): Record<string, any> {
  const json: Record<string, any> = {}

  Object.entries(parsed).forEach(([category, specs]) => {
    if (Object.keys(specs).length > 0) {
      json[category] = specs
    }
  })

  return json
}
