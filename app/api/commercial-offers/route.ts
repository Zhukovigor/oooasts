import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const body = await request.json()

    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([
        {
          title: body.title,
          price: body.price,
          price_with_vat: body.priceWithVat,
          availability: body.availability,
          payment_type: body.paymentType,
          vat_included: body.vatIncluded,
          diagnostics_passed: body.diagnosticsPassed,
          image_url: body.imageUrl,
          specifications: body.specifications,
          currency: "RUB",
        },
      ])
      .select()

    if (error) {
      console.error("[v0] Error saving commercial offer:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Error in POST commercial-offers:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
