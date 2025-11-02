import { generateText } from "ai"

export interface AIParsingResult {
  specifications: Record<string, Record<string, string>>
  confidence: number
  summary: string
}

export async function parseSpecificationsWithAI(text: string): Promise<AIParsingResult> {
  const prompt = `You are a technical specifications parser. Extract all technical specifications from the following equipment description and return them in a structured format.

Equipment Description:
${text}

Please extract all specifications and organize them into these categories (only include categories that have data):
- Основные параметры (Basic Parameters)
- Двигатель (Engine)
- Гидравлика (Hydraulics)
- Габариты (Dimensions)
- Рабочие характеристики (Operating Characteristics)
- Шасси (Chassis)
- Ходовая часть (Undercarriage)
- Подвеска (Suspension)
- Весовые показатели (Weight Parameters)
- Крановое оборудование (Crane Equipment)
- Трансмиссия (Transmission)
- Прочее (Other)

For each specification, provide:
1. Clear, descriptive key name
2. Value with appropriate units of measurement

Important rules:
- Always include units of measurement (мм, см, м, км, кг, т, л, кВт, л.с., об/мин, °, МПа, etc.)
- Clean and normalize all values
- Group similar specifications together
- Only include specifications that are explicitly mentioned in the description

Return the response as valid JSON with this structure:
{
  "Основные параметры": {
    "Модель": "value",
    "Производитель": "value"
  },
  "Двигатель": {
    "Тип": "value",
    "Мощность": "value"
  }
}

Only return the JSON object, no additional text.`

  try {
    const { text: responseText } = await generateText({
      model: "openai/gpt-4-mini",
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 2000,
    })

    const parsed = JSON.parse(responseText)

    return {
      specifications: parsed,
      confidence: 0.95,
      summary: `Успешно извлечено ${Object.values(parsed).reduce((sum: number, specs: any) => sum + Object.keys(specs).length, 0)} характеристик`,
    }
  } catch (error) {
    console.error("[v0] AI parsing error:", error)
    throw new Error("Ошибка при парсинге с помощью AI")
  }
}
