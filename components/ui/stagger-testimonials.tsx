"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const SQRT_5000 = Math.sqrt(5000)

const testimonials = [
  {
    tempId: 0,
    testimonial:
      "Приобрели экскаватор Komatsu PC400 через АСТС. Отличное качество техники, все документы оформлены быстро и профессионально. Рекомендуем!",
    by: "Иван Петров, ООО СтройМастер",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=IvanPetrov&backgroundColor=3b82f6&textColor=ffffff",
  },
  {
    tempId: 1,
    testimonial:
      "Работаем с АСТС уже второй год. Поставили нам 5 единиц техники из Китая. Цены адекватные, сроки соблюдают, всегда на связи.",
    by: "Сергей Волков, Директор ГорноТех",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=SergeyVolkov&backgroundColor=10b981&textColor=ffffff",
  },
  {
    tempId: 2,
    testimonial:
      "Искали надежного поставщика б/у спецтехники. АСТС помогли подобрать оптимальный вариант под наш бюджет. Техника работает отлично!",
    by: "Алексей Смирнов, ИП Смирнов А.В.",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=AlexeySmirnov&backgroundColor=8b5cf6&textColor=ffffff",
  },
  {
    tempId: 3,
    testimonial:
      "Полный цикл сопровождения от заказа до получения техники с документами. Очень удобно работать, когда все вопросы решает один поставщик.",
    by: "Дмитрий Козлов, ООО ДорСтрой",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=DmitryKozlov&backgroundColor=ef4444&textColor=ffffff",
  },
  {
    tempId: 4,
    testimonial:
      "Заказали погрузчик из Китая. АСТС организовали доставку, растаможку, все документы с НДС. Профессиональный подход на всех этапах.",
    by: "Михаил Новиков, Зам. директора ТехСервис",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=MikhailNovikov&backgroundColor=f59e0b&textColor=ffffff",
  },
  {
    tempId: 5,
    testimonial:
      "Отличная компания! Помогли выбрать экскаватор под наши задачи, проконсультировали по всем вопросам. Техника пришла в срок, качество отличное.",
    by: "Андрей Морозов, Главный инженер СтройАльянс",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=AndreyMorozov&backgroundColor=6366f1&textColor=ffffff",
  },
  {
    tempId: 6,
    testimonial:
      "Сотрудничаем с АСТС более года. Закупили несколько единиц горно-шахтного оборудования. Всё работает исправно, цены конкурентные.",
    by: "Владимир Соколов, ООО РудПром",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=VladimirSokolov&backgroundColor=ec4899&textColor=ffffff",
  },
  {
    tempId: 7,
    testimonial:
      "Индивидуальный подход к каждому клиенту - это про АСТС. Учли все наши пожелания, подобрали оптимальный вариант техники.",
    by: "Олег Лебедев, Директор МегаСтрой",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=OlegLebedev&backgroundColor=06b6d4&textColor=ffffff",
  },
  {
    tempId: 8,
    testimonial:
      "Быстрая доставка, прозрачные условия, никаких скрытых платежей. Получили технику точно в оговоренные сроки. Спасибо команде АСТС!",
    by: "Николай Федоров, ИП Федоров Н.С.",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=NikolayFedorov&backgroundColor=f97316&textColor=ffffff",
  },
  {
    tempId: 9,
    testimonial:
      "Приобрели бульдозер через АСТС. Качество техники превзошло ожидания. Менеджеры всегда на связи, решают любые вопросы оперативно.",
    by: "Евгений Павлов, ООО ЗемлеСтрой",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=EvgenyPavlov&backgroundColor=84cc16&textColor=ffffff",
  },
  {
    tempId: 10,
    testimonial:
      "Надежный партнер в поставках спецтехники. Гибкие условия оплаты, полное документальное сопровождение. Рекомендуем всем коллегам!",
    by: "Артем Григорьев, Коммерческий директор ПромТех",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=ArtemGrigoriev&backgroundColor=a855f7&textColor=ffffff",
  },
  {
    tempId: 11,
    testimonial:
      "Заказывали экскаватор Komatsu PC200. Техника пришла в отличном состоянии, все как обещали. Цена оказалась ниже, чем у конкурентов.",
    by: "Максим Васильев, ООО СпецМаш",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=MaximVasiliev&backgroundColor=059669&textColor=ffffff",
  },
  {
    tempId: 12,
    testimonial:
      "АСТС - профессионалы своего дела. Помогли с выбором техники, организовали доставку из Китая. Всё прошло гладко и без проблем.",
    by: "Роман Кузнецов, Технический директор ГорМаш",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=RomanKuznetsov&backgroundColor=0ea5e9&textColor=ffffff",
  },
  {
    tempId: 13,
    testimonial:
      "Отличное соотношение цены и качества. Купили подержанный экскаватор - работает как новый. Спасибо за честность и профессионализм!",
    by: "Виктор Орлов, ИП Орлов В.М.",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=ViktorOrlov&backgroundColor=dc2626&textColor=ffffff",
  },
  {
    tempId: 14,
    testimonial:
      "Сотрудничество с АСТС - это гарантия качества и надежности. Закупили несколько единиц техники, все работает безупречно.",
    by: "Игорь Семенов, ООО СтройИнвест",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=IgorSemenov&backgroundColor=7c3aed&textColor=ffffff",
  },
  {
    tempId: 15,
    testimonial:
      "Оперативность и профессионализм - главные качества команды АСТС. Всегда готовы помочь и проконсультировать по любым вопросам.",
    by: "Константин Белов, Зам. директора ТехноСтрой",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=KonstantinBelov&backgroundColor=ea580c&textColor=ffffff",
  },
  {
    tempId: 16,
    testimonial:
      "Приобрели через АСТС погрузчик и экскаватор. Техника качественная, цены адекватные. Будем продолжать сотруднич��ство!",
    by: "Павел Медведев, ООО АвтоТранс",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=PavelMedvedev&backgroundColor=16a34a&textColor=ffffff",
  },
  {
    tempId: 17,
    testimonial:
      "Долго искали надежного поставщика спецтехники из Китая. АСТС полностью оправдали наши ожидания. Рекомендуем!",
    by: "Станислав Попов, Директор МашСтрой",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=StanislavPopov&backgroundColor=2563eb&textColor=ffffff",
  },
  {
    tempId: 18,
    testimonial:
      "Прозрачные условия работы, никаких скрытых комиссий. Получили технику точно в срок с полным пакетом документов.",
    by: "Денис Захаров, ООО ГорноДобыча",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=DenisZakharov&backgroundColor=be185d&textColor=ffffff",
  },
  {
    tempId: 19,
    testimonial:
      "АСТС - это команда профессионалов, которым можно доверять. Помогли подобрать оптимальное решение под наш бюджет и задачи.",
    by: "Юрий Романов, Главный механик СтройПлюс",
    imgSrc: "https://api.dicebear.com/7.x/initials/svg?seed=YuryRomanov&backgroundColor=0891b2&textColor=ffffff",
  },
]

interface TestimonialCardProps {
  position: number
  testimonial: (typeof testimonials)[0]
  handleMove: (steps: number) => void
  cardSize: number
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ position, testimonial, handleMove, cardSize }) => {
  const isCenter = position === 0
  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out",
        isCenter
          ? "z-10 bg-gray-900 text-white border-gray-900"
          : "z-0 bg-white text-gray-900 border-gray-200 hover:border-gray-400",
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter ? "0px 8px 0px 4px hsl(var(--border))" : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-gray-300"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />
      <img
        src={testimonial.imgSrc || "/placeholder.svg"}
        alt={`${testimonial.by.split(",")[0]}`}
        className="mb-4 h-14 w-12 bg-gray-100 object-cover object-top"
        style={{
          boxShadow: "3px 3px 0px hsl(var(--background))",
        }}
      />
      <h3 className={cn("text-base sm:text-xl font-medium", isCenter ? "text-white" : "text-gray-900")}>
        "{testimonial.testimonial}"
      </h3>
      <p
        className={cn(
          "absolute bottom-8 left-8 right-8 mt-2 text-sm italic",
          isCenter ? "text-gray-300" : "text-gray-600",
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  )
}

export const StaggerTestimonials: React.FC = () => {
  const [cardSize, setCardSize] = useState(365)
  const [testimonialsList, setTestimonialsList] = useState(testimonials)

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList]
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift()
        if (!item) return
        newList.push({ ...item, tempId: Math.random() })
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop()
        if (!item) return
        newList.unshift({ ...item, tempId: Math.random() })
      }
    }
    setTestimonialsList(newList)
  }

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)")
      setCardSize(matches ? 365 : 290)
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  return (
    <div className="relative w-full overflow-hidden bg-white" style={{ height: 600 }}>
      {testimonialsList.map((testimonial, index) => {
        const position =
          testimonialsList.length % 2 ? index - (testimonialsList.length + 1) / 2 : index - testimonialsList.length / 2
        return (
          <TestimonialCard
            key={testimonial.tempId}
            testimonial={testimonial}
            handleMove={handleMove}
            position={position}
            cardSize={cardSize}
          />
        )
      })}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          onClick={() => handleMove(-1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-white border-2 border-gray-300 hover:bg-gray-900 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2",
          )}
          aria-label="Предыдущий отзыв"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => handleMove(1)}
          className={cn(
            "flex h-14 w-14 items-center justify-center text-2xl transition-colors",
            "bg-white border-2 border-gray-300 hover:bg-gray-900 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2",
          )}
          aria-label="Следующий отзыв"
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
}
