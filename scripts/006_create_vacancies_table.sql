-- Create vacancies table
CREATE TABLE IF NOT EXISTS public.vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL DEFAULT 'Россия (удаленно)',
  employment_type VARCHAR(100) NOT NULL DEFAULT 'Полная занятость',
  salary_type VARCHAR(100) NOT NULL DEFAULT '% от продаж',
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active vacancies
CREATE INDEX IF NOT EXISTS idx_vacancies_active ON public.vacancies(is_active, sort_order);

-- Enable RLS
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (only active vacancies)
CREATE POLICY "Allow public read access to active vacancies"
  ON public.vacancies
  FOR SELECT
  USING (is_active = true);

-- Create policy for all operations (for admin)
CREATE POLICY "Allow all operations on vacancies"
  ON public.vacancies
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default vacancy
INSERT INTO public.vacancies (
  title,
  location,
  employment_type,
  salary_type,
  description,
  requirements,
  responsibilities,
  conditions,
  is_active,
  sort_order
) VALUES (
  'Менеджер по продажам спецтехники',
  'Россия (удаленно)',
  'Полная занятость',
  '% от продаж',
  'ООО АСТС - ведущий поставщик строительной спецтехники из Китая. Мы ищем амбициозных менеджеров по продажам для работы с корпоративными клиентами. Вы будете предлагать качественную спецтехнику (экскаваторы Komatsu, бульдозеры, погрузчики) руководителям строительных и горнодобывающих компаний.',
  ARRAY[
    'Возраст: 18-35 лет',
    'Пол: Женский',
    'Опыт работы в продажах приветствуется',
    'Коммуникабельность и нацеленность на результат',
    'Умение работать с CRM-системами',
    'Знание основ делового общения'
  ],
  ARRAY[
    'Поиск и привлечение новых клиентов',
    'Общение с руководителями компаний',
    'Презентация спецтехники и оборудования',
    'Консультирование клиентов по характеристикам техники',
    'Ведение переговоров и заключение сделок',
    'Сопровождение клиентов на всех этапах сделки'
  ],
  '{"salary": "Процент от продаж (от 3% до 7% в зависимости от объема)", "format": "Полностью удаленная работа из любого города России", "schedule": "Гибкий график работы, планируйте время самостоятельно", "training": "Полное обучение продукту, техникам продаж и работе с CRM"}'::jsonb,
  true,
  1
);
