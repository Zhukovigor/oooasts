import { type NextRequest, NextResponse } from "next/server"
import { postToMultipleChannels } from "@/app/lib/multi-channel-posting"

export async function POST(request: NextRequest) {
  try {
    const { title, description, imageUrl, postUrl, contentType, contentId, buttonText, channelIds } =
      await request.json()

    const results = await postToMultipleChannels({
      title,
      description,
      imageUrl,
      postUrl,
      contentType,
      contentId,
      buttonText,
      selectedChannels: channelIds,
    })

    const allSuccess = results.every((r) => r.success)

    return NextResponse.json({
      success: allSuccess,
      results,
    })
  } catch (error) {
    console.error("[v0] Error in multi-channel posting:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
