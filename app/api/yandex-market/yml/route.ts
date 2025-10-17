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

// Полный список брендов для всех категорий спецтехники
const BRANDS = {
  // Экскаваторы
  excavator: [
    'Komatsu', 'Caterpillar', 'Hitachi', 'Volvo', 'Liebherr', 'Hyundai', 'Doosan', 
    'Kobelco', 'Case', 'JCB', 'SANY', 'XCMG', 'Zoomlion', 'LiuGong', 'Lonking',
    'Shantui', 'SDLG', 'Sunward', 'Takeuchi', 'Yanmar', 'Kubota', 'Bobcat',
    'New Holland', 'Terex', 'O&K', 'Demag', 'Bomag', 'Atlas', 'Mecalac'
  ],
  
  // Автобетононасосы
  concrete_pump: [
    'SANY', 'Zoomlion', 'Schwing', 'Putzmeister', 'CIFA', 'Mecbo', 'Concord',
    'Junjin', 'Kyokuto', 'Morgen', 'Reed', 'Allentown', 'Mayco', 'Dynamic',
    'Ajax', 'Muller', 'Stetter', 'Elba', 'Hess', 'Haomei'
  ],
  
  // Бульдозеры
  bulldozer: [
    'Komatsu', 'Caterpillar', 'Shantui', 'LiuGong', 'XGMA', 'SEM', 'YTO',
    'Changlin', 'Lovol', 'Shandong', 'Bharat', 'BEML', 'Chetra', 'ChTZ',
    'Fiatallis', 'Hanomag', 'International', 'John Deere'
  ],
  
  // Автокраны
  crane: [
    'XCMG', 'SANY', 'Liebherr', 'Tadano', 'Grove', 'Manitowoc', 'Kato',
    'Kobelco', 'Link-Belt', 'P&H', 'Demag', 'IHI', 'Favelle', 'Raimondi',
    'Zoomlion', 'Fushun', 'Dalian', 'Samsung', 'Hyundai'
  ],
  
  // Погрузчики
  loader: [
    'Volvo', 'Caterpillar', 'Komatsu', 'LiuGong', 'XCMG', 'Lonking', 'SDLG',
    'Shantui', 'Doosan', 'Hyundai', 'JCB', 'Case', 'New Holland', 'John Deere',
    'Kawasaki', 'Hitachi', 'Terex', 'O&K', 'LeTourneau', 'Clark'
  ],
  
  // Автогрейдеры
  grader: [
    'Caterpillar', 'Komatsu', 'Volvo', 'John Deere', 'Champion', 'Dresser',
    'Galion', 'Austin-Western', 'Buffalo', 'BEML', 'LiuGong', 'XCMG',
    'Shantui', 'SEM', 'Terex', 'Changan', 'Lovol'
  ],
  
  // Катки дорожные
  roller: [
    'Bomag', 'Hamm', 'Dynapac', 'Volvo', 'Caterpillar', 'SANY', 'XCMG',
    'Zoomlion', 'Ammann', 'Sakai', 'Ingersoll Rand', 'Wacker Neuson',
    'Weichai', 'LiuGong', 'Lonking', 'Vibromax', 'Case'
  ],
  
  // Трубоукладчики
  pipelayer: [
    'Caterpillar', 'Komatsu', 'Liebherr', 'John Deere', 'Case', 'Hitachi',
    'Kobelco', 'XCMG', 'SANY', 'Zoomlion', 'LiuGong', 'Shantui'
  ],
  
  // Компакторы
  compactor: [
    'Caterpillar', 'Bomag', 'Hamm', 'Dynapac', 'Volvo', 'SANY', 'XCMG',
    'Zoomlion', 'Ammann', 'Sakai', 'Wacker Neuson', 'Weichai', 'LiuGong'
  ],
  
  // Седельные тягачи
  truck: [
    'FAW', 'Sinotruk', 'Shaanxi', 'Beiben', 'Howo', 'JAC', 'Foton', 'Dongfeng',
    'Shacman', 'CAMC', 'Volvo', 'Scania', 'MAN', 'Mercedes-Benz', 'DAF',
    'Iveco', 'Renault', 'Kamaz', 'MAZ', 'KRAZ'
  ],
  
  // Самосвалы
  dump_truck: [
    'BelAZ', 'Caterpillar', 'Komatsu', 'Hitachi', 'Liebherr', 'Volvo',
    'Terex', 'Euclid', 'Howo', 'Sinotruk', 'Shaanxi', 'Shacman', 'XCMG',
    'SANY', 'Zoomlion', 'LiuGong', 'Bell', 'Aveling'
  ],
  
  // Автобетоносмесители
  concrete_mixer: [
    'SANY', 'Zoomlion', 'XCMG', 'Liebherr', 'Schwing', 'Putzmeister', 'CIFA',
    'Junjin', 'Kyokuto', 'Mecbo', 'Concord', 'Haomei', 'LiuGong', 'Shantui'
  ],
  
  // Эвакуаторы
  tow_truck: [
    'Chevrolet', 'Ford', 'International', 'Freightliner', 'Kenworth', 'Peterbilt',
    'Volvo', 'Mack', 'Isuzu', 'Hino', 'Fuso', 'Iveco', 'MAN', 'Mercedes-Benz'
  ],
  
  // Лесовозы
  timber_truck: [
    'Scania', 'Volvo', 'MAN', 'Mercedes-Benz', 'DAF', 'Iveco', 'Renault',
    'Kamaz', 'MAZ', 'Ural', 'ZIL', 'FAW', 'Sinotruk', 'Shaanxi'
  ],
  
  // Тралы
  trailer: [
    'Goldhofer', 'Scheuerle', 'Kamag', 'Nicolas', 'Cometto', 'Talbert',
    'Rogers', 'Landoll', 'Witzco', 'Trail King', 'Doolittle', 'Fontaine'
  ],
  
  // Полуприцепы
  semi_trailer: [
    'Schmitz', 'Kogel', 'Krone', 'Wielton', 'Lamberet', 'Chereau', 'Gray-Adams',
    'Reitnouer', 'Timpte', 'Stoughton', 'Vanguard', 'Utility', 'Great Dane'
  ],
  
  // Автовышки
  aerial_platform: [
    'JLG', 'Genie', 'Skyjack', 'Snorkel', 'Haulotte', 'Niftylift', 'Time',
    'Runshare', 'Dinolift', 'Sinoboom', 'XCMG', 'SANY', 'Zoomlion'
  ],
  
  // Рефрижераторы
  refrigerator: [
    'Carrier', 'Thermo King', 'Mitsubishi', 'Denso', 'Sanden', 'Hubbard',
    'Kingtec', 'FRIGOBLOCK', 'ThermoLite', 'Coldline'
  ],
  
  // Краны-манипуляторы
  manipulator: [
    'Fassi', 'Hiab', 'Palfinger', 'Atlas', 'Cormach', 'Effer', 'Iowa',
    'MBB', 'Mullan', 'Stellar', 'Tirre', 'UNIC', 'Venieri'
  ],
  
  // Автовозы
  car_carrier: [
    'Cottrell', 'Benson', 'Duncan', 'Drewry', 'Jays', 'Kaufman', 'Precision',
    'Trailmaster', 'Wheeler', 'Transcraft', 'Miller', 'Supreme'
  ],
  
  // Фургоны
  van: [
    'Mercedes-Benz', 'Ford', 'Volkswagen', 'Fiat', 'Renault', 'Peugeot',
    'Citroen', 'Iveco', 'GAZ', 'Hyundai', 'Kia', 'Nissan', 'Toyota'
  ]
}

// Модели для каждого бренда
const MODELS = {
  // Экскаваторы
  excavator: {
    'Komatsu': ['PC200', 'PC210', 'PC220', 'PC300', 'PC350', 'PC400', 'PC450'],
    'Caterpillar': ['320', '325', '330', '336', '349', '374', '390'],
    'Hitachi': ['ZX200', 'ZX210', 'ZX250', 'ZX330', 'ZX350', 'ZX470'],
    'Volvo': ['EC210', 'EC240', 'EC290', 'EC350', 'EC380', 'EC480'],
    'SANY': ['SY215', 'SY235', 'SY265', 'SY335', 'SY365', 'SY465'],
    'XCMG': ['XE215', 'XE230', 'XE270', 'XE335', 'XE370', 'XE490']
  },
  
  // Автобетононасосы
  concrete_pump: {
    'SANY': ['33 метра', '37 метра', '42 метра', '47 метра', '52 метра', '56 метра'],
    'Zoomlion': ['33 метра', '38 метра', '43 метра', '48 метра', '53 метра', '58 метра'],
    'Schwing': ['32 метра', '36 метра', '41 метра', '46 метра', '51 метра', '56 метра']
  },
  
  // Бульдозеры
  bulldozer: {
    'Komatsu': ['D65', 'D75', 'D85', 'D155', 'D275', 'D375'],
    'Caterpillar': ['D6', 'D7', 'D8', 'D9', 'D10', 'D11'],
    'Shantui': ['SD16', 'SD22', 'SD32', 'SD42', 'SD52']
  },
  
  // Автокраны
  crane: {
    'XCMG': ['25 тонн', '50 тонн', '70 тонн', '100 тонн', '130 тонн', '160 тонн'],
    'SANY': ['25 тонн', '55 тонн', '80 тонн', '110 тонн', '130 тонн', '160 тонн'],
    'Liebherr': ['50 тонн', '75 тонн', '100 тонн', '130 тонн', '160 тонн', '200 тонн']
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: articles, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .not("published_at", "is", null)
      .order("published_at", { ascending: false })
      .limit(100)

    if (error) throw new Error(`Database error: ${error.message}`)

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asts-nsk.ru"

    // Формируем YML
    let ymlContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    ymlContent += `<yml_catalog date="${new Date().toISOString()}">\n`
    ymlContent += `<shop>\n`
    ymlContent += `<name>ООО АСТС - Поставщик спецтехники из Китая</name>\n`
    ymlContent += `<company>ООО АСТС</company>\n`
    ymlContent += `<url>${baseUrl}</url>\n`
    ymlContent += `<phone>+7 (919) 042-24-92</phone>\n`
    
    // Полный список категорий
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
    
    articles?.forEach((article, index) => {
      const articleUrl = `${baseUrl}/stati/${article.slug}`
      const { categoryId, type, brand, model, price, specs } = getProductInfo(article, index)
      
      ymlContent += `<offer id="${article.id}" available="true">\n`
      ymlContent += `<url>${escapeYml(articleUrl)}</url>\n`
      ymlContent += `<price>${price}</price>\n`
      ymlContent += `<currencyId>RUR</currencyId>\n`
      ymlContent += `<categoryId>${categoryId}</categoryId>\n`
      ymlContent += `<picture>${escapeYml(article.main_image || `${baseUrl}/images/tech-${categoryId}.jpg`)}</picture>\n`
      
      // Основная информация
      ymlContent += `<name>${escapeYml(article.title || `${brand} ${model} - ${type}`)}</name>\n`
      ymlContent += `<vendor>${escapeYml(brand)}</vendor>\n`
      ymlContent += `<vendorCode>ASTS-${article.id}</vendorCode>\n`
      ymlContent += `<description>${escapeYml(article.excerpt || article.content?.substring(0, 500) || `Продажа ${type.toLowerCase()} ${brand} ${model}. ${specs.description}`)}</description>\n`
      
      // Параметры для фильтрации
      ymlContent += `<param name="Вид техники">${escapeYml(type)}</param>\n`
      ymlContent += `<param name="Производитель">${escapeYml(brand)}</param>\n`
      ymlContent += `<param name="Модель">${escapeYml(model)}</param>\n`
      ymlContent += `<param name="Год выпуска">${specs.year}</param>\n`
      ymlContent += `<param name="Состояние">${specs.condition}</param>\n`
      ymlContent += `<param name="Страна производства">${specs.country}</param>\n`
      ymlContent += `<param name="Гарантия">${specs.warranty}</param>\n`
      
      // Специфичные параметры
      if (specs.weight) ymlContent += `<param name="Вес" unit="кг">${specs.weight}</param>\n`
      if (specs.power) ymlContent += `<param name="Мощность" unit="л.с.">${specs.power}</param>\n`
      if (specs.capacity) ymlContent += `<param name="Грузоподъемность" unit="т">${specs.capacity}</param>\n`
      if (specs.hours) ymlContent += `<param name="Моточасы">${specs.hours}</param>\n`
      if (specs.height) ymlContent += `<param name="Высота подачи" unit="м">${specs.height}</param>\n`
      if (specs.volume) ymlContent += `<param name="Объем" unit="м³">${specs.volume}</param>\n`
      
      // Условия продажи
      ymlContent += `<sales_notes>Спецтехника в наличии и под заказ! Поставка спецтехники из Китая • Доставка по России • Контроль качества • Поставка в короткие сроки • Лизинг от 5% • Отличные цены</sales_notes>\n`
      
      // Доставка
      ymlContent += `<delivery>true</delivery>\n`
      ymlContent += `<delivery-options>\n`
      ymlContent += `<option cost="0" days="14-21"/>\n`
      ymlContent += `<option cost="50000" days="7-10"/>\n`
      ymlContent += `</delivery-options>\n`
      
      ymlContent += `</offer>\n`
    })
    
    ymlContent += `</offers>\n`
    ymlContent += `</shop>\n`
    ymlContent += `</yml_catalog>`

    return new Response(ymlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })

  } catch (error) {
    console.error("YML generation error:", error)
    return new Response(`<?xml version="1.0"?><error>YML generation failed</error>`, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  }
}

// Функция для определения информации о товаре
function getProductInfo(article: any, index: number) {
  const title = article.title?.toLowerCase() || ""
  const content = article.content?.toLowerCase() || ""
  
  // Определяем тип техники по заголовку и содержанию
  let categoryId = "1"
  let type = "Спецтехника"
  let brandArray = BRANDS.excavator
  let modelType = "excavator"
  
  if (title.includes('экскаватор') || content.includes('экскаватор')) {
    categoryId = "2"
    type = "Экскаватор"
    brandArray = BRANDS.excavator
    modelType = "excavator"
  } else if (title.includes('бетононасос') || content.includes('бетононасос')) {
    categoryId = "3"
    type = "Автобетононасос"
    brandArray = BRANDS.concrete_pump
    modelType = "concrete_pump"
  } else if (title.includes('бульдозер') || content.includes('бульдозер')) {
    categoryId = "4"
    type = "Бульдозер"
    brandArray = BRANDS.bulldozer
    modelType = "bulldozer"
  } else if ((title.includes('кран') && !title.includes('манипулятор')) || content.includes('автокран')) {
    categoryId = "5"
    type = "Автокран"
    brandArray = BRANDS.crane
    modelType = "crane"
  } else if (title.includes('погрузчик') || content.includes('погрузчик')) {
    categoryId = "6"
    type = "Погрузчик"
    brandArray = BRANDS.loader
    modelType = "loader"
  } else if (title.includes('автогрейдер') || content.includes('автогрейдер')) {
    categoryId = "7"
    type = "Автогрейдер"
    brandArray = BRANDS.grader
    modelType = "grader"
  } else if (title.includes('каток') || content.includes('дорожный каток')) {
    categoryId = "8"
    type = "Дорожный каток"
    brandArray = BRANDS.roller
    modelType = "roller"
  } else if (title.includes('трубоукладчик') || content.includes('трубоукладчик')) {
    categoryId = "9"
    type = "Трубоукладчик"
    brandArray = BRANDS.pipelayer
    modelType = "pipelayer"
  } else if (title.includes('компактор') || content.includes('компактор')) {
    categoryId = "10"
    type = "Компактор"
    brandArray = BRANDS.compactor
    modelType = "compactor"
  } else if (title.includes('бетоносмеситель') || content.includes('бетоносмеситель')) {
    categoryId = "11"
    type = "Автобетоносмеситель"
    brandArray = BRANDS.concrete_mixer
    modelType = "concrete_mixer"
  } else if (title.includes('тягач') || content.includes('седельный тягач')) {
    categoryId = "13"
    type = "Седельный тягач"
    brandArray = BRANDS.truck
    modelType = "truck"
  } else if (title.includes('самосвал') || content.includes('самосвал')) {
    categoryId = "14"
    type = "Самосвал"
    brandArray = BRANDS.dump_truck
    modelType = "dump_truck"
  } else if (title.includes('эвакуатор') || content.includes('эвакуатор')) {
    categoryId = "15"
    type = "Эвакуатор"
    brandArray = BRANDS.tow_truck
    modelType = "tow_truck"
  } else if (title.includes('лесовоз') || content.includes('лесовоз')) {
    categoryId = "16"
    type = "Лесовоз"
    brandArray = BRANDS.timber_truck
    modelType = "timber_truck"
  } else if (title.includes('трал') || content.includes('трал')) {
    categoryId = "17"
    type = "Трал"
    brandArray = BRANDS.trailer
    modelType = "trailer"
  } else if (title.includes('полуприцеп') || content.includes('полуприцеп')) {
    categoryId = "18"
    type = "Полуприцеп"
    brandArray = BRANDS.semi_trailer
    modelType = "semi_trailer"
  } else if (title.includes('автовышка') || content.includes('автовышка')) {
    categoryId = "19"
    type = "Автовышка"
    brandArray = BRANDS.aerial_platform
    modelType = "aerial_platform"
  } else if (title.includes('рефрижератор') || content.includes('рефрижератор')) {
    categoryId = "20"
    type = "Рефрижератор"
    brandArray = BRANDS.refrigerator
    modelType = "refrigerator"
  } else if (title.includes('манипулятор') || content.includes('кран-манипулятор')) {
    categoryId = "21"
    type = "Кран-манипулятор"
    brandArray = BRANDS.manipulator
    modelType = "manipulator"
  } else if (title.includes('автовоз') || content.includes('автовоз')) {
    categoryId = "22"
    type = "Автовоз"
    brandArray = BRANDS.car_carrier
    modelType = "car_carrier"
  } else if (title.includes('фургон') || content.includes('фургон')) {
    categoryId = "23"
    type = "Фургон"
    brandArray = BRANDS.van
    modelType = "van"
  }
  
  // Выбираем бренд и модель
  const brand = brandArray[index % brandArray.length]
  let model = "Standard"
  
  if (MODELS[modelType] && MODELS[modelType][brand]) {
    const models = MODELS[modelType][brand]
    model = models[index % models.length]
  }
  
  // Генерируем реалистичные характеристики
  const basePrice = getBasePrice(type)
  const price = (basePrice + (index % 10) * (basePrice * 0.1)).toFixed(0)
  
  const specs = {
    year: (2021 + (index % 4)).toString(),
    weight: (10000 + (index % 20) * 1000).toString(),
    power: (150 + (index % 15) * 20).toString(),
    capacity: (15 + (index % 10)).toString(),
    hours: (800 + (index % 20) * 100).toString(),
    height: (30 + (index % 10)).toString(),
    volume: (6 + (index % 5)).toString(),
    condition: index % 5 === 0 ? "Б/у" : "Новое",
    country: ["Китай", "Япония", "Германия", "Корея", "США"][index % 5],
    warranty: index % 5 === 0 ? "12 месяцев" : "24 месяца",
    description: `${type} ${brand} ${model}. Прямые поставки без посредников. Гарантия качества.`
  }
  
  return { categoryId, type, brand, model, price, specs }
}

// Базовые цены по типам техники
function getBasePrice(type: string): number {
  const prices: {[key: string]: number} = {
    'Экскаватор': 6500000,
    'Автобетононасос': 12500000,
    'Бульдозер': 8500000,
    'Автокран': 9500000,
    'Погрузчик': 4500000,
    'Автогрейдер': 7000000,
    'Дорожный каток': 3500000,
    'Трубоукладчик': 12000000,
    'Компактор': 2800000,
    'Автобетоносмеситель': 5500000,
    'Седельный тягач': 3500000,
    'Самосвал': 4800000,
    'Эвакуатор': 2200000,
    'Лесовоз': 4200000,
    'Трал': 3800000,
    'Полуприцеп': 1800000,
    'Автовышка': 5200000,
    'Рефрижератор': 3200000,
    'Кран-манипулятор': 2800000,
    'Автовоз': 4500000,
    'Фургон': 1500000
  }
  
  return prices[type] || 5000000
}
