import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { createAdminClient } from "@/lib/supabase/admin"
import fetch from "node-fetch"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 })
    }

    const buffer = await response.buffer()

    const webpBuffer = await sharp(buffer).webp({ quality: 95, effort: 6 }).toBuffer()

    const supabase = createAdminClient()
    const timestamp = Date.now()
    const fileName = `banners/webp/${timestamp}.webp`

    const { data, error } = await supabase.storage.from("images").upload(fileName, webpBuffer, {
      contentType: "image/webp",
      upsert: false,
    })

    if (error) {
      console.error("Upload error:", error)
      return NextResponse.json({ error: "Failed to upload WebP" }, { status: 500 })
    }

    const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      webpUrl: publicUrl.publicUrl,
      originalSize: buffer.length,
      webpSize: webpBuffer.length,
      compression: Math.round(((buffer.length - webpBuffer.length) / buffer.length) * 100),
    })
  } catch (error) {
    console.error("Conversion error:", error)
    return NextResponse.json({ error: "Image conversion failed" }, { status: 500 })
  }
}
