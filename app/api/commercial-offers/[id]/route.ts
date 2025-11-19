// app/api/commercial-offers/[id]/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { data: offer, error } = await supabase
      .from("commercial_offers")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("[GET] Error fetching offer:", error)
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error("[GET] Error in commercial offers API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Validate offer exists
    const { data: existingOffer, error: fetchError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.title && !body.equipment) {
      return NextResponse.json(
        { error: "Title or equipment is required" },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("commercial_offers")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("[PUT] Error updating offer:", error)
      return NextResponse.json(
        { error: "Failed to update offer" },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[PUT] Error in commercial offers API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Validate offer exists
    const { data: existingOffer, error: fetchError } = await supabase
      .from("commercial_offers")
      .select("id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingOffer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from("commercial_offers")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("[DELETE] Error deleting offer:", error)
      return NextResponse.json(
        { error: "Failed to delete offer" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "Offer deleted successfully",
      deletedId: params.id
    })
  } catch (error) {
    console.error("[DELETE] Error in commercial offers API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
