import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import EditOfferClient from "./edit-client"

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: offer } = await supabase
    .from("commercial_offers")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Предложение не найдено</h1>
          <Link href="/admin/commercial-offers">
            <Button>Вернуться</Button>
          </Link>
        </div>
      </div>
    )
  }

  return <EditOfferClient initialOffer={offer} />
}
