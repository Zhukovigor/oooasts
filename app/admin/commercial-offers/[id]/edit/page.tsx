import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import EditOfferClient from "./edit-client"
import { notFound } from "next/navigation"

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  
  try {
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

    const { data: offer, error } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error || !offer) {
      console.error(`Offer not found: ${params.id}`, error)
      notFound()
    }

    return <EditOfferClient initialOffer={offer} />

  } catch (error) {
    console.error("Error loading offer:", error)
    notFound()
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Редактирование КП - ${params.id}`,
    description: "Редактирование коммерческого предложения",
  }
}
