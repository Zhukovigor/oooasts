'use client'

interface CategorySpecs {
  [key: string]: string | number
}

interface SpecificationsDisplayProps {
  categories: Array<[string, CategorySpecs]>
}

export function SpecificationsDisplay({ categories }: SpecificationsDisplayProps) {
  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mt-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Характеристики</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {categories.map(([category, specs]) => (
          <div key={category} className="space-y-4">
            {/* Category Header */}
            <div className="pb-3 border-b-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {category}
              </h3>
            </div>
            
            {/* Specs List */}
            <div className="space-y-3">
              {Object.entries(specs).map(([key, value]) => {
                // Пропускаем пустые значения
                if (!value || value === "" || value === "N/A") {
                  return null
                }

                return (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-gray-600 text-sm font-medium">
                      {key}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm text-right">
                      {typeof value === "number" ? value.toString() : String(value)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
