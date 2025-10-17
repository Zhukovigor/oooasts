import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const revalidate = 3600

function escapeYml(unsafe: string): string {
  if (!unsafe) return ""
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Соответствие категорий каталога ID для Яндекс
const CATEGORY_MAPPING: { [key: string]: { id: string; name: string } } = {
  'ekskavatory': { id: '2', name: 'Экскаваторы' },
  'pogruzchiki': { id: '6', name: 'Погрузчики' },
  'buldozery': { id: '4', name: 'Бульдозеры' },
  'avtokrany': { id: '5', name: 'Автокраны' },
  'avtobetononasosy': { id: '3', name: 'Автобетононасосы' },
  'avtogreydery': { id: '7', name: 'Автогрейдеры' },
  'karki-dorozhnye': { id: '8', name: 'Дорожные катки' },
  'truboukladchiki': { id: '9', name: 'Трубоукладчики' },
  'avtobetonosmesiteli': { id: '11', name: 'Автобетоносмесители' },
  'tyagachi': { id: '13', name: 'Седельные тягачи' },
  'samosvaly': { id: '14', name: 'Самосвалы' },
  'traly': { id: '17', name: 'Тралы' },
  'polupritsepy': { id: '18', name: 'Полуприцепы' },
  'avtovyshki': { id: '19', name: 'Автовышки' },
  'manipulyatory': { id: '21', name: 'Краны-манипуляторы' },
  'furgony': { id: '23', name: 'Фургоны' }
}

// Бренды для разных категорий
const BRANDS_BY_CATEGORY: { [key: string]: string[] } = {
  'ekskavatory': ['Komatsu', 'Caterpillar', 'Hitachi', 'Volvo', 'SANY', 'XCMG', 'Zoomlion', 'LiuGong'],
  'pogruzchiki': ['Volvo', 'Caterpillar', 'Komatsu', 'LiuGong', 'XCMG', 'Lonking', 'SDLG'],
  'buldozery': ['Komatsu', 'Caterpillar', 'Shantui', 'LiuGong', 'SEM'],
  'avtokrany': ['XCMG', 'SANY', 'Liebherr', 'Tadano', 'Grove'],
  'avtobetononasosy': ['SANY', 'Zoomlion', 'Schwing', 'Putzmeister'],
  'avtogreydery': ['Caterpillar', 'Komatsu', 'Volvo', 'John Deere'],
  'karki-dorozhnye': ['Bomag', 'Hamm', 'Dynapac', 'Volvo', 'SANY'],
  'truboukladchiki': ['Caterpillar', 'Komatsu', 'Liebherr'],
  'avtobetonosmesiteli': ['SANY', 'Zoomlion', 'XCMG', 'Liebherr'],
  'tyagachi': ['FAW', 'Sinotruk', 'Shaanxi', 'Volvo', 'Scania', 'MAN'],
  'samosvaly': ['Howo', 'Sinotruk', 'Shaanxi', 'Shacman', 'XCMG', 'SANY'],
  'traly': ['Goldhofer', 'Scheuerle', 'Kamag', 'Nicolas'],
  'polupritsepy': ['Schmitz', 'Kogel', 'Krone', 'Wielton'],
  'avtovyshki': ['JLG', 'Genie', 'Skyjack', 'XCMG', 'SANY'],
  'manipulyatory': ['Fassi', 'Hiab', 'Palfinger', 'Atlas'],
  'furgony': ['Mercedes-Benz', 'Ford', 'Volkswagen', 'Fiat']
}

// Модели для брендов
const MODELS: { [key: string]: { [key: string]: string[] } } = {
  'Komatsu': ['PC200', 'PC210', 'PC220', 'PC300', 'PC350', 'PC400'],
  'Caterpillar': ['320', '325', '330', '336', '349', '374'],
  'Hitachi': ['ZX200', 'ZX210', 'ZX250', 'ZX330', 'ZX350'],
  'Volvo': ['EC210', 'EC240', 'EC290', 'EC350', 'EC380'],
  'SANY': ['SY215', 'SY235', 'SY265', 'SY335', 'SY365'],
  'XCMG': ['XE215', 'XE230', 'XE270', 'XE335', 'XE370'],
  'Zoomlion': ['ZE205', 'ZE230', 'ZE265', 'ZE335'],
  'LiuGong': ['CLG856', 'CLG862', 'CLG888', 'CLG915'],
  'Shantui': ['SD16', 'SD22', 'SD32'],
  'Lonking': ['CDM856', 'CDM862'],
  'SDLG': ['L956', 'L968'],
  'SEM': ['SD16', 'SD22'],
  'Liebherr': ['LTM1050', 'LTM1100', 'LTM1160'],
  'Tadano': ['TR250', 'TR300', 'TR350'],
  'Grove': ['RT540', 'RT650', 'RT750'],
  'Schwing': ['32X', '36X', '41X'],
  'Putzmeister': ['32M', '36M', '42M'],
  'John Deere': ['672', '772', '872'],
  'Bomag': ['BW120', 'BW140', 'BW160'],
  'Hamm': ['HD120', 'HD140'],
  'Dynapac': ['CC1200', 'CC1400'],
  'FAW': ['J6', 'J7'],
  'Sinotruk': ['Howo', 'Hohan'],
  'Shaanxi': ['X3000', 'M3000'],
  'Scania': ['R450', 'R500'],
  'MAN': ['TGX', 'TGS'],
  'Howo': ['ZZ3257', 'ZZ3317'],
  'Shacman': ['X3000', 'M3000'],
  'Goldhofer': ['THP/SL', 'STZ/XL'],
  'Scheuerle': ['SPMT'],
  'Kamag': ['K24', 'K25'],
  'Nicolas': ['Tractomas'],
  'Schmitz': ['S.CS', 'S.KO'],
  'Kogel': ['KGT', 'KIP'],
  'Krone': ['Cool Liner', 'Prof Liner'],
  'Wielton': ['SDS', 'KIP'],
  'JLG': ['600S', '800S', '1000S'],
  'Genie': ['S-60', 'S-80', 'S-100'],
  'Skyjack': ['SJ63', 'SJ85'],
  'Fassi': ['F145', 'F165', 'F185'],
  'Hiab': ['115', '135', '155'],
  'Palfinger': ['11501', '13502'],
  'Atlas': ['100.2', '120.2'],
  'Mercedes-Benz': ['Sprinter', 'Vito'],
  'Ford': ['Transit', 'Custom'],
  'Volkswagen': ['Crafter', 'Transporter'],
  'Fiat': ['Ducato', 'Talento']
}

// Базовые цены по типам техники
function getBasePrice(category: string): number {
  const prices: { [key: string]: number } = {
    'ekskavatory': 6500000,
    'avtobetononasosy': 12500000,
    'buldozery': 8500000,
    'avtokrany': 9500000,
    'pogruzchiki': 4500000,
    'avtogreydery': 7000000,
    'karki-dorozhnye': 3500000,
    'truboukladchiki': 12000000,
    'avtobetonosmesiteli': 5500000,
    'tyagachi': 3500000,
    'samosvaly': 4800000,
    'traly': 3800000,
    'polupritsepy': 1800000,
    'avtovyshki': 5200000,
    'manipulyatory': 2800000,
    'furgony': 1500000
  }
  
  return prices[category] || 5000000
}

// Генерация характеристик для техники
function generateSpecs(category: string, brand: string, model: string, index: number) {
  const baseSpecs = {
    year: (2021 + (index % 4)).toString(),
    weight: (10000 + (index % 20) * 1000).toString(),
    power: (150 + (index % 15) * 20).toString(),
    capacity: (15 + (index % 10)).toString(),
    hours: (800 + (index % 20) * 100).toString(),
    height: (30 + (index % 10)).toString(),
    volume: (6 + (index % 5)).toString(),
    condition: index % 5 === 0 ? "Б/у" : "Новое",
    country: ["Китай", "Япония", "Германия", "Корея", "США"][index % 5],
    warranty: index % 5 === 0 ? "12 месяцев" : "24 месяца"
  }

  return baseSpecs
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"

    // Получаем все категории техники
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("type", "equipment")

    if (categoriesError) throw new Error(`Categories error: ${categoriesError.message}`)

    // Собираем всю технику из всех категорий
    let allEquipment: any[] = []

    for (const category of categories || []) {
      const { data: equipment, error: equipmentError } = await supabase
        .from("equipment")
        .select("*")
        .eq("category_slug", category.slug)
        .eq("status", "active")
        .limit(50)

      if (equipmentError) {
        console.error(`Error fetching equipment for ${category.slug}:`, equipmentError)
        continue
      }

      if (equipment) {
        // Добавляем информацию о категории к каждому оборудованию
        const equipmentWithCategory = equipment.map(item => ({
          ...item,
          category_slug: category.slug,
          category_name: category.name
        }))
        allEquipment = [...allEquipment, ...equipmentWithCategory]
      }
    }

    console.log(`Found ${allEquipment.length} equipment items`)

    // Формируем YML для транспортных средств
    let ymlContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    ymlContent += `<yml_catalog date="${new Date().toISOString()}">\n`
    ymlContent += `<transport>\n`
    ymlContent += `<name>ООО АСТС - Поставщик спецтехники из Китая</name>\n`
    ymlContent += `<company>ООО АСТС</company>\n`
    ymlContent += `<url>${baseUrl}</url>\n`
    ymlContent += `<phone>+7 (919) 042-24-92</phone>\n`
    
    // Категории для транспортных средств
    ymlContent += `<categories>\n`
    ymlContent += `<category id="1">Спецтехника</category>\n`
    ymlContent += `<category id="2" parentId="1">Экскаваторы</category>\n`
    ymlContent += `<category id="3" parentId="1">Автобетононасосы</category>\n`
    ymlContent += `<category id="4" parentId="1">Бульдозеры</category>\n`
    ymlContent += `<category id="5" parentId="1">Автокраны</category>\n`
    ymlContent += `<category id="6" parentId="1">Погрузчики</category>\n`
    ymlContent += `<category id="7" parentId="1">Автогрейдеры</category>\n`
    ymlContent += `<category id="8" parentId="1">Дорожные катки</category>\n`
    ymlContent += `<category id="9" parentId="1">Трубоукладчики</category>\n`
    ymlContent += `<category id="10" parentId="1">Компакторы</category>\n`
    ymlContent += `<category id="11" parentId="1">Автобетоносмесители</category>\n`
    ymlContent += `<category id="12">Грузовая техника</category>\n`
    ymlContent += `<category id="13" parentId="12">Седельные тягачи</category>\n`
    ymlContent += `<category id="14" parentId="12">Самосвалы</category>\n`
    ymlContent += `<category id="15" parentId="12">Эвакуаторы</category>\n`
    ymlContent += `<category id="16" parentId="12">Лесовозы</category>\n`
    ymlContent += `<category id="17" parentId="12">Тралы</category>\n`
    ymlContent += `<category id="18" parentId="12">Полуприцепы</category>\n`
    ymlContent += `<category id="19" parentId="12">Автовышки</category>\n`
    ymlContent += `<category id="20" parentId="12">Рефрижераторы</category>\n`
    ymlContent += `<category id="21" parentId="12">Краны-манипуляторы</category>\n`
    ymlContent += `<category id="22" parentId="12">Автовозы</category>\n`
    ymlContent += `<category id="23" parentId="12">Фургоны</category>\n`
    ymlContent += `</categories>\n`
    
    // Курсы валют
    ymlContent += `<currencies>\n`
    ymlContent += `<currency id="RUR" rate="1"/>\n`
    ymlContent += `</currencies>\n`
    
    // Предложения
    ymlContent += `<offers>\n`
    
    allEquipment.forEach((equipment, index) => {
      const categoryMapping = CATEGORY_MAPPING[equipment.category_slug] || { id: '1', name: 'Спецтехника' }
      const categoryId = categoryMapping.id
      const type = categoryMapping.name
      
      // Получаем бренд и модель
      const availableBrands = BRANDS_BY_CATEGORY[equipment.category_slug] || ['Komatsu']
      const brand = availableBrands[index % availableBrands.length]
      const availableModels = MODELS[brand] || ['Standard']
      const model = availableModels[index % availableModels.length]
      
      // Генерируем цену и характеристики
      const basePrice = getBasePrice(equipment.category_slug)
      const price = equipment.price ? equipment.price.toString() : (basePrice + (index % 10) * (basePrice * 0.1)).toFixed(0)
      const specs = generateSpecs(equipment.category_slug, brand, model, index)
      
      // Формируем URL
      const equipmentUrl = `${baseUrl}/katalog/${equipment.category_slug}/${equipment.slug}`
      
      ymlContent += `<offer id="${equipment.id}">\n`
      ymlContent += `<url>${escapeYml(equipmentUrl)}</url>\n`
      ymlContent += `<price>${price}</price>\n`
      ymlContent += `<currencyId>RUR</currencyId>\n`
      ymlContent += `<categoryId>${categoryId}</categoryId>\n`
      
      // Изображение
      const imageUrl = equipment.images && equipment.images.length > 0 
        ? equipment.images[0] 
        : `${baseUrl}/images/tech-${categoryId}.jpg`
      ymlContent += `<picture>${escapeYml(imageUrl)}</picture>\n`
      
      // Обязательные поля для транспортных средств
      ymlContent += `<mark>${escapeYml(brand)}</mark>\n`
      ymlContent += `<model>${escapeYml(model)}</model>\n`
      ymlContent += `<year>${specs.year}</year>\n`
      ymlContent += `<condition>${specs.condition === "Новое" ? "new" : "used"}</condition>\n`
      
      // Основная информация
      const name = equipment.title || `${brand} ${model} - ${type}`
      ymlContent += `<name>${escapeYml(name)}</name>\n`
      ymlContent += `<vendor>${escapeYml(brand)}</vendor>\n`
      ymlContent += `<vendorCode>ASTS-${equipment.id}</vendorCode>\n`
      
      const description = equipment.description 
        ? equipment.description.substring(0, 500)
        : `Продажа ${type.toLowerCase()} ${brand} ${model}. Прямые поставки из Китая. Гарантия качества.`
      ymlContent += `<description>${escapeYml(description)}</description>\n`
      
      // Дополнительные параметры
      ymlContent += `<param name="Вид техники">${escapeYml(type)}</param>\n`
      ymlContent += `<param name="Производитель">${escapeYml(brand)}</param>\n`
      ymlContent += `<param name="Модель">${escapeYml(model)}</param>\n`
      ymlContent += `<param name="Год выпуска">${specs.year}</param>\n`
      ymlContent += `<param name="Состояние">${specs.condition}</param>\n`
      ymlContent += `<param name="Страна производства">${specs.country}</param>\n`
      ymlContent += `<param name="Гарантия">${specs.warranty}</param>\n`
      
      // Технические параметры
      if (specs.weight) ymlContent += `<param name="Вес" unit="кг">${specs.weight}</param>\n`
      if (specs.power) ymlContent += `<param name="Мощность" unit="л.с.">${specs.power}</param>\n`
      if (specs.capacity) ymlContent += `<param name="Грузоподъемность" unit="т">${specs.capacity}</param>\n`
      if (specs.hours) ymlContent += `<param name="Моточасы">${specs.hours}</param>\n`
      if (specs.height) ymlContent += `<param name="Высота подачи" unit="м">${specs.height}</param>\n`
      if (specs.volume) ymlContent += `<param name="Объем" unit="м³">${specs.volume}</param>\n`
      
      // Параметры для транспортных средств
      ymlContent += `<param name="enginePower" unit="hp">${specs.power}</param>\n`
      ymlContent += `<param name="mileage" unit="km">${(parseInt(specs.hours) * 2).toString()}</param>\n`
      ymlContent += `<param name="vehicleType">${escapeYml(type)}</param>\n`
      
      // Условия продажи
      ymlContent += `<sales_notes>Спецтехника в наличии и под заказ! Поставка спецтехники из Китая • Доставка по России • Контроль качества • Поставка в короткие сроки • Лизинг от 5% • Отличные цены</sales_notes>\n`
      
      // Доставка
      ymlContent += `<delivery>true</delivery>\n`
      ymlContent += `<delivery-options>\n`
      ymlContent += `<option cost="0" days="14-21"/>\n`
      ymlContent += `<option cost="50000" days="7-10"/>\n`
      ymlContent += `</delivery-options>\n`
      
      // Наличие
      ymlContent += `<available>true</available>\n`
      
      ymlContent += `</offer>\n`
    })
    
    ymlContent += `</offers>\n`
    ymlContent += `</transport>\n`
    ymlContent += `</yml_catalog>`

    return new Response(ymlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    console.error("YML generation error:", error)
    return new Response(`<?xml version="1.0"?><error>YML generation failed: ${error}</error>`, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  }
}
