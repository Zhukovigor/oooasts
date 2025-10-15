// Translation mapping for catalog specification keys
export const specificationTranslations: Record<string, string> = {
  // Concrete Pump specifications
  pump_output: "Производительность насоса",
  max_pressure: "Максимальное давление",
  boom_sections: "Секции стрелы",
  vertical_reach: "Вертикальный вылет",
  horizontal_reach: "Горизонтальный вылет",
  concrete_cylinder: "Бетонный цилиндр",
  hopper_capacity: "Объем бункера",
  chassis: "Шасси",
  wheelbase: "Колесная база",
  max_speed: "Максимальная скорость",
  fuel_tank: "Топливный бак",
  hydraulic_tank: "Гидравлический бак",

  // Excavator specifications
  operating_weight: "Рабочий вес",
  bucket_capacity: "Объем ковша",
  max_digging_depth: "Макс. глубина копания",
  max_digging_reach: "Макс. радиус копания",
  max_digging_height: "Макс. высота копания",
  max_dumping_height: "Макс. высота разгрузки",
  ground_pressure: "Удельное давление на грунт",
  engine_manufacturer: "Производитель двигателя",
  engine_model: "Модель двигателя",
  rated_power: "Номинальная мощность",
  displacement: "Рабочий объем двигателя",
  travel_speed: "Скорость передвижения",
  swing_speed: "Скорость поворота",

  // Common specifications
  engine_power: "Мощность двигателя",
  working_weight: "Рабочий вес",
  max_reach: "Максимальный вылет",

  // Grader specifications
  blade_width: "Ширина отвала",
  blade_height: "Высота отвала",

  // Bulldozer specifications
  blade_capacity: "Объем отвала",

  // Roller specifications
  drum_width: "Ширина вальца",
  compaction_width: "Ширина уплотнения",

  // Loader specifications
  load_capacity: "Грузоподъемность",
  lifting_height: "Высота подъема",

  // General
  manufacturer: "Производитель",
  model: "Модель",
  year: "Год выпуска",
  condition: "Состояние",
  price: "Цена",
  location: "Местоположение",
}

// Function to translate specification key to Russian
export function translateSpecKey(key: string): string {
  return specificationTranslations[key] || key.replace(/_/g, " ")
}
