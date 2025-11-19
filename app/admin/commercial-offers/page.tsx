import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CommercialOffersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Коммерческие предложения</h1>
          <Link href="/admin/commercial-offers/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Создать КП</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Здесь будут отображаться созданные коммерческие предложения</p>
          </div>
        </div>
      </div>
    </div>
  )
}
