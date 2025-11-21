import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import DeleteOfferButton from "@/components/DeleteOfferButton"

export default async function CommercialOffersPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  })

  const { data: offers = [] } = await supabase
    .from("commercial_offers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Коммерческие предложения</h1>
          <Link href="/admin/commercial-offers/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Создать КП</Button>
          </Link>
        </div>

        {offers && offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer: any) => (
              <div
                key={offer.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {offer.image_url && (
                  <img
                    src={offer.image_url || "/placeholder.svg"}
                    alt={offer.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{offer.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {offer.price?.toLocaleString("ru-RU")} {offer.currency || "руб."}
                      </p>
                      {offer.vat_included && <p className="text-xs text-gray-500">Стоимость с НДС</p>}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-3">
                    {offer.availability && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {offer.availability}
                      </span>
                    )}
                    {offer.payment_type && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{offer.payment_type}</span>
                    )}
                    {offer.diagnostics_passed && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Диагностика пройдена
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-4">{new Date(offer.created_at).toLocaleDateString("ru-RU")}</p>

                  <div className="flex gap-2">
                    <Link href={`/api/commercial-offers/${offer.id}/pdf`} className="flex-1" target="_blank">
                      <Button variant="outline" className="w-full text-xs bg-transparent">
                        Скачать PDF
                      </Button>
                    </Link>
                    <Link href={`/api/commercial-offers/${offer.id}/export`} className="flex-1" target="_blank">
                      <Button variant="outline" className="w-full text-xs bg-transparent">
                        JSON
                      </Button>
                    </Link>
                    <Link href={`/admin/commercial-offers/${offer.id}/edit`} className="flex-1">
                      <Button className="w-full text-xs">Редактировать</Button>
                    </Link>
                    <DeleteOfferButton offerId={offer.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Здесь будут отображаться созданные коммерческие предложения</p>
          </div>
        )}
      </div>
    </div>
  )
}
