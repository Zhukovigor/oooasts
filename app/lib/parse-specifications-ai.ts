import { generateText } from "ai"

export interface AIParseResult {
  specifications: Record<string, Record<string, string>>
  confidence: number
}

export async function parseSpecificationsWithAI(text: string): Promise<AIParseResult> {
  const prompt = `Вы эксперт по извлечению технических характеристик из текста о спецтехнике.

Текст для анализа:
${text}

Пожалуйста, извлеките все технические характеристики и верните их в следующем формате JSON (без markdown блоков, только JSON):
{
  "Двигатель": {
    "Мощность": "194 кВт",
    "Объем": "9.3 л"
  },
  "Размеры": {
    "Длина": "9500 мм",
    "Ширина": "3350 мм",
    "Вес": "31100 кг"
  },
  "Производительность": {
    "Объем ковша": "1.14 м³",
    "Максимальная глубина копания": "6400 мм"
  }
}

Правила:
1. Категоризируйте характеристики по типам (Двигатель, Размеры, Производительность, Гидравлика, Трансмиссия, Прочие)
2. Для каждой характеристики укажите значение с единицей измерения
3. Используйте только информацию, которая явно указана в тексте
4. Если информация неполная, не придумывайте значения
5. Возвращайте только JSON без дополнительного текста

Ответьте только с JSON объектом, начиная с { и заканчивая }`

  try {
    const { text: response } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Извлекаем JSON из ответа
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[v0] AI response didn't contain valid JSON:", response)
      throw new Error("Invalid JSON response from AI")
    }

    const specifications = JSON.parse(jsonMatch[0])

    return {
      specifications,
      confidence: 0.95,
    }
  } catch (error) {
    console.error("[v0] AI parsing error:", error)
    throw new Error("Failed to parse specifications with AI")
  }
}
