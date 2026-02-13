import { type NextRequest, NextResponse } from "next/server"
import { getClothingByCreator, getAssetThumbnails, type RobloxAsset } from "@/lib/roblox-api"
import { checkApiEnabled, logApiRequest, checkBlockedSession } from "@/lib/api-middleware"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const apiCheck = checkApiEnabled(request)
  if (apiCheck) return apiCheck

  const sessionCheck = checkBlockedSession(request)
  if (sessionCheck) return sessionCheck

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const cursor = searchParams.get("cursor") || undefined

  if (!userId) {
    logApiRequest(request, 400, startTime)
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  try {
    const clothingResponse = await getClothingByCreator(Number.parseInt(userId), cursor)

    const assetIds = clothingResponse.data.map((item) => item.id)
    const thumbnailMap = await getAssetThumbnails(assetIds)

    const assets: RobloxAsset[] = clothingResponse.data.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: thumbnailMap.get(item.id) || "",
      type: "Clothing" as const,
      source: "Catalog" as const,
    }))

    logApiRequest(request, 200, startTime, undefined, userId)
    return NextResponse.json({
      data: assets,
      nextPageCursor: clothingResponse.nextPageCursor,
    })
  } catch (error) {
    console.error("Error fetching clothing:", error)
    logApiRequest(request, 500, startTime, undefined, userId)
    return NextResponse.json({ error: "Failed to fetch clothing" }, { status: 500 })
  }
}
