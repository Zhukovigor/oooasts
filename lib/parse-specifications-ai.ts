import { generateText } from "ai"

export interface AIParsingResult {
  specifications: Record<string, Record<string, string>>
  confidence: number
  summary: string
}

export async function parseSpecificationsWithAI(text: string): Promise<AIParsingResult> {
  const prompt = `You are a technical specifications parser. Extract ALL technical specifications from the equipment description, handling any format variations.

Equipment Description:
${text}

IMPORTANT: The text may contain specifications in various formats:
- "Ключ: значение" or "Ключ = значение" or "Ключ - значение"
- "-Ключ" or "*Ключ" or "[Ключ]" formats
- Nested structures like "Размеры корзины: *длина = 3.0 м, *ширина = 1.2 м"
- Mixed separators (;, =, -, :)
- Missing or uppercase/lowercase inconsistencies

Please:
1. Extract ALL specifications regardless of format
2. Clean up keys by removing brackets, asterisks, dashes from the beginning
3. Standardize all values with proper units (мм, см, м, км, кг, т, л, кВт, л.с., об/мин, °, МПа)
4. Handle nested parameters by extracting them as individual specs
5. Combine related parameters into logical category groupings

Return JSON with these categories (only include categories with data):
- Основные параметры
- Двигатель
- Гидравлика
- Габариты
- Рабочие характеристики
- Шасси
- Ходовая часть
- Подвеска
- Весовые показатели
- Крановое оборудование
- Трансмиссия
- Системы безопасности
- Прочее

Example output:
{
  "Габариты": {
    "Длина": "3.0 м",
    "Ширина": "1.2 м",
    "Высота": "36 м"
  },
  "Рабочие характеристики": {
    "Рабочая высота": "36 м"
  }
}

Return ONLY valid JSON, no other text.`

  try {
    const { text: responseText } = await generateText({
      model: "openai/gpt-4-mini",
      prompt: prompt,
      temperature: 0.2, // Lower temperature for more consistent parsing
      maxTokens: 2500, // Increased token limit for complex texts
    })

    let parsed: Record<string, any> = {}
    const cleanedResponse = responseText.trim()

    try {
      parsed = JSON.parse(cleanedResponse)
    } catch (parseError) {
      // Try to extract JSON from response if it contains extra text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw parseError
      }
    }

    const totalSpecs = Object.values(parsed).reduce(
      (sum: number, specs: any) => sum + (typeof specs === "object" ? Object.keys(specs).length : 0),
      0,
    )

    return {
      specifications: parsed,
      confidence: 0.92,
      summary: `Успешно извлечено ${totalSpecs} характеристик`,
    }
  } catch (error) {
    console.error("[v0] AI parsing error:", error)
    throw new Error("Ошибка при парсинге с помощью AI")
  }
}
