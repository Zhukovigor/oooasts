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

// Функция для создания пустого, но валидного YML при ошибках
function createEmptyYml(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts.vercel.app"
  
  return `<?xml version="1.0" encoding="windows-1251"?>
<yml_catalog date="${new Date().toISOString()}">
<shop>
<name>ASTS - SpecTech from China</name>
<company>ASTS LLC</company>
<url>${baseUrl}</url>
<phone>+79190422492</phone>
<categories>
<category id="1">Special Equipment</category>
<category id="2" parentId="1">Excavators</category>
<category id="3" parentId="1">Concrete Pumps</category>
<category id="4" parentId="1">Bulldozers</category>
<category id="5" parentId="1">Cranes</category>
<category id="6" parentId="1">Loaders</category>
<category id="7" parentId="1">Graders</category>
<category id="8" parentId="1">Road Rollers</category>
<category id="9" parentId="1">Pipe Layers</category>
<category id="10" parentId="1">Compactors</category>
<category id="11" parentId="1">Concrete Mixers</category>
<category id="12">Trucks</category>
<category id="13" parentId="12">Trucks</category>
<category id="14" parentId="12">Dump Trucks</category>
<category id="15" parentId="12">Tow Trucks</category>
<category id="16" parentId="12">Timber Trucks</category>
<category id="17" parentId="12">Trailers</category>
<category id="18" parentId="12">Semi Trailers</category>
<category id="19" parentId="12">Aerial Platforms</category>
<category id="20" parentId="12">Refrigerators</category>
<category id="21" parentId="12">Manipulators</category>
<category id="22" parentId="12">Car Carriers</category>
<category id="23" parentId="12">Vans</category>
</categories>
<currencies>
<currency id="RUR" rate="1"/>
</currencies>
<offers>
</offers>
</shop>
</yml_catalog>`
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

    if (categoriesError) {
      console.error("Categories error:", categoriesError)
      const emptyYml = createEmptyYml()
      return new Response(emptyYml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=windows-1251',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

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
        const equipmentWithCategory = equipment.map(item => ({
          ...item,
          category_slug: category.slug,
          category_name: category.name
        }))
        allEquipment = [...allEquipment, ...equipmentWithCategory]
      }
    }

    console.log(`Found ${allEquipment.length} equipment items`)

    if (allEquipment.length === 0) {
      const emptyYml = createEmptyYml()
      return new Response(emptyYml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=windows-1251',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      })
    }

    // Формируем YML с правильной кодировкой
    let ymlContent = `<?xml version="1.0" encoding="windows-1251"?>\n`
    ymlContent += `<yml_catalog date="${new Date().toISOString()}">\n`
    ymlContent += `<shop>\n`
    ymlContent += `<name>ASTS - SpecTech from China</name>\n`
    ymlContent += `<company>ASTS LLC</company>\n`
    ymlContent += `<url>${baseUrl}</url>\n`
    ymlContent += `<phone>+79190422492</phone>\n`
    
    // Категории на английском для избежания проблем с кодировкой
    ymlContent += `<categories>\n`
    ymlContent += `<category id="1">Special Equipment</category>\n`
    ymlContent += `<category id="2" parentId="1">Excavators</category>\n`
    ymlContent += `<category id="3" parentId="1">Concrete Pumps</category>\n`
    ymlContent += `<category id="4" parentId="1">Bulldozers</category>\n`
    ymlContent += `<category id="5" parentId="1">Cranes</category>\n`
    ymlContent += `<category id="6" parentId="1">Loaders</category>\n`
    ymlContent += `<category id="7" parentId="1">Graders</category>\n`
    ymlContent += `<category id="8" parentId="1">Road Rollers</category>\n`
    ymlContent += `<category id="9" parentId="1">Pipe Layers</category>\n`
    ymlContent += `<category id="10" parentId="1">Compactors</category>\n`
    ymlContent += `<category id="11" parentId="1">Concrete Mixers</category>\n`
    ymlContent += `<category id="12">Trucks</category>\n`
    ymlContent += `<category id="13" parentId="12">Trucks</category>\n`
    ymlContent += `<category id="14" parentId="12">Dump Trucks</category>\n`
    ymlContent += `<category id="15" parentId="12">Tow Trucks</category>\n`
    ymlContent += `<category id="16" parentId="12">Timber Trucks</category>\n`
    ymlContent += `<category id="17" parentId="12">Trailers</category>\n`
    ymlContent += `<category id="18" parentId="12">Semi Trailers</category>\n`
    ymlContent += `<category id="19" parentId="12">Aerial Platforms</category>\n`
    ymlContent += `<category id="20" parentId="12">Refrigerators</category>\n`
    ymlContent += `<category id="21" parentId="12">Manipulators</category>\n`
    ymlContent += `<category id="22" parentId="12">Car Carriers</category>\n`
    ymlContent += `<category id="23" parentId="12">Vans</category>\n`
    ymlContent += `</categories>\n`
    
    // Курсы валют
    ymlContent += `<currencies>\n`
    ymlContent += `<currency id="RUR" rate="1"/>\n`
    ymlContent += `</currencies>\n`
    
    // Предложения
    ymlContent += `<offers>\n`
    
    allEquipment.forEach((equipment, index) => {
      const categoryMapping = CATEGORY_MAPPING[equipment.category_slug] || { id: '1', name: 'Special Equipment' }
      const categoryId = categoryMapping.id
      const type = categoryMapping.name
      
      const availableBrands = BRANDS_BY_CATEGORY[equipment.category_slug] || ['Komatsu']
      const brand = availableBrands[index % availableBrands.length]
      const availableModels = MODELS[brand] || ['Standard']
      const model = availableModels[index % availableModels.length]
      
      const basePrice = getBasePrice(equipment.category_slug)
      const price = equipment.price ? equipment.price.toString() : (basePrice + (index % 10) * (basePrice * 0.1)).toFixed(0)
      const specs = generateSpecs(equipment.category_slug, brand, model, index)
      
      const equipmentUrl = `${baseUrl}/katalog/${equipment.category_slug}/${equipment.slug}`
      
      ymlContent += `<offer id="${equipment.id}">\n`
      ymlContent += `<url>${escapeYml(equipmentUrl)}</url>\n`
      ymlContent += `<price>${price}</price>\n`
      ymlContent += `<currencyId>RUR</currencyId>\n`
      ymlContent += `<categoryId>${categoryId}</categoryId>\n`
      
      const imageUrl = equipment.images && equipment.images.length > 0 
        ? equipment.images[0] 
        : `${baseUrl}/images/tech-${categoryId}.jpg`
      ymlContent += `<picture>${escapeYml(imageUrl)}</picture>\n`
      
      // Название на английском для избежания проблем
      const name = equipment.title || `${brand} ${model} - ${type}`
      ymlContent += `<name>${escapeYml(name)}</name>\n`
      ymlContent += `<vendor>${escapeYml(brand)}</vendor>\n`
      ymlContent += `<vendorCode>ASTS-${equipment.id}</vendorCode>\n`
      
      const description = equipment.description 
        ? equipment.description.substring(0, 500)
        : `Sale of ${type.toLowerCase()} ${brand} ${model}. Direct supplies from China. Quality guarantee.`
      ymlContent += `<description>${escapeYml(description)}</description>\n`
      
      // Параметры для транспортных средств
      ymlContent += `<param name="vehicleType">${escapeYml(type)}</param>\n`
      ymlContent += `<param name="mark">${escapeYml(brand)}</param>\n`
      ymlContent += `<param name="model">${escapeYml(model)}</param>\n`
      ymlContent += `<param name="year">${specs.year}</param>\n`
      ymlContent += `<param name="condition">${specs.condition === "Новое" ? "new" : "used"}</param>\n`
      
      // Дополнительные параметры
      ymlContent += `<param name="Type">${escapeYml(type)}</param>\n`
      ymlContent += `<param name="Brand">${escapeYml(brand)}</param>\n`
      ymlContent += `<param name="Country">${specs.country}</param>\n`
      ymlContent += `<param name="Warranty">${specs.warranty}</param>\n`
      
      // Технические параметры
      if (specs.weight) ymlContent += `<param name="Weight" unit="kg">${specs.weight}</param>\n`
      if (specs.power) ymlContent += `<param name="Power" unit="hp">${specs.power}</param>\n`
      if (specs.capacity) ymlContent += `<param name="Capacity" unit="t">${specs.capacity}</param>\n`
      if (specs.hours) ymlContent += `<param name="Hours">${specs.hours}</param>\n`
      if (specs.height) ymlContent += `<param name="Height" unit="m">${specs.height}</param>\n`
      if (specs.volume) ymlContent += `<param name="Volume" unit="m3">${specs.volume}</param>\n`
      
      // Условия продажи на английском
      ymlContent += `<sales_notes>Special equipment in stock and on order! Supply of special equipment from China • Delivery across Russia • Quality control • Supply in short time • Leasing from 5% • Great prices</sales_notes>\n`
      
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
    ymlContent += `</shop>\n`
    ymlContent += `</yml_catalog>`

    return new Response(ymlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=windows-1251',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    console.error("YML generation error:", error)
    const emptyYml = createEmptyYml()
    return new Response(emptyYml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=windows-1251',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  }
}
