import { scanAndPostNewContent } from "@/app/lib/auto-posting-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Verify cron secret if available
  const authHeader = request.headers.get("Authorization")
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await scanAndPostNewContent()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
