// app/api/commercial-offers/route.ts
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Schema for validation
const CommercialOfferSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  equipment: z.string().optional(),
  model: z.string().optional(),
  price: z.number().min(0).optional(),
  price_with_vat: z.number().min(0).optional(),
  priceWithVat: z.number().min(0).optional(), // Alternative field name
  availability: z.string().optional(),
  payment_type: z.string().optional(),
  paymentType: z.string().optional(), // Alternative field name
  vat_included: z.boolean().optional(),
  vatIncluded: z.boolean().optional(), // Alternative field name
  diagnostics_passed: z.boolean().optional(),
  diagnosticsPassed: z.boolean().optional(), // Alternative field name
  lease: z.boolean().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")), // Alternative field name
  specifications: z.record(z.string()).optional(),
  currency: z.string().default("RUB"),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Validate input
    const validationResult = CommercialOfferSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input data", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Normalize field names and prepare data for insertion
    const insertData = {
      title: validatedData.title,
      equipment: validatedData.equipment,
      model: validatedData.model,
      price: validatedData.price,
      price_with_vat: validatedData.price_with_vat || validatedData.priceWithVat,
      availability: validatedData.availability,
      payment_type: validatedData.payment_type || validatedData.paymentType,
      vat_included: validatedData.vat_included || validatedData.vatIncluded || false,
      diagnostics_passed: validatedData.diagnostics_passed || validatedData.diagnosticsPassed || false,
      lease: validatedData.lease || false,
      image_url: validatedData.image_url || validatedData.imageUrl,
      specifications: validatedData.specifications || {},
      currency: validatedData.currency,
      description: validatedData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert into database
    const { data, error } = await supabase
      .from("commercial_offers")
      .insert([insertData])
      .select(`
        *,
        calculated_price: price,
        has_image: image_url
      `)
      .single()

    if (error) {
      console.error("[POST] Error saving commercial offer:", error)
      
      // Handle specific Supabase errors
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: "A commercial offer with this title already exists" },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create commercial offer",
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Success response
    return NextResponse.json(
      { 
        success: true,
        message: "Commercial offer created successfully",
        data 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("[POST] Error in commercial-offers API:", error)
    
    // Handle different types of errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET method to fetch all commercial offers
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from("commercial_offers")
      .select("*", { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,equipment.ilike.%${search}%,model.ilike.%${search}%`)
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to)

    if (error) {
      console.error("[GET] Error fetching commercial offers:", error)
      return NextResponse.json(
        { error: "Failed to fetch commercial offers" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error("[GET] Error in commercial-offers API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
