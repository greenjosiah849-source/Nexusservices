import { type NextRequest, NextResponse } from "next/server"
import {
  getUniversesByCreator,
  getAllGamePassesByUserEnhanced,
  getClothingByCreator,
  getUGCByCreator,
  getGamePassIcons,
  getAssetThumbnails,
  type RobloxAsset,
} from "@/lib/roblox-api"
import { checkApiEnabled, logApiRequest, checkBlockedSession } from "@/lib/api-middleware"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const apiCheck = checkApiEnabled(request)
  if (apiCheck) return apiCheck

  const sessionCheck = checkBlockedSession(request)
  if (sessionCheck) return sessionCheck

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    logApiRequest(request, 400, startTime)
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const userIdNum = Number.parseInt(userId)

  try {
    // Fetch all data in parallel for maximum speed
    const [universesData, gamePassesData, clothingData, ugcData] = await Promise.all([
      getUniversesByCreator(userIdNum),
      getAllGamePassesByUserEnhanced(userIdNum),
      getClothingByCreator(userIdNum),
      getUGCByCreator(userIdNum),
    ])

    // Process universes
    const universeAssets: RobloxAsset[] = universesData.data.map((u) => ({
      id: u.id,
      name: u.name,
      price: null,
      imageUrl: "",
      type: "Universe" as const,
      source: "Universe" as const,
      universeId: u.id,
    }))

    // Process game passes - already have universeId from the fetch
    const allGamePasses = gamePassesData.flatMap((u) => 
      u.gamePasses.map((gp) => ({ ...gp, universeId: u.universeId }))
    )

    // Process clothing and UGC
    const clothingItems = clothingData.data || []
    const ugcItems = ugcData.data || []

    // Fetch thumbnails in parallel
    const [gamePassIcons, assetThumbnails] = await Promise.all([
      getGamePassIcons(allGamePasses.map((gp) => gp.id)),
      getAssetThumbnails([...clothingItems.map((c) => c.id), ...ugcItems.map((u) => u.id)]),
    ])

    const gamePassAssets: RobloxAsset[] = allGamePasses.map((gp) => ({
      id: gp.id,
      name: gp.displayName || gp.name,
      price: gp.price,
      imageUrl: gamePassIcons.get(gp.id) || "",
      type: "GamePass" as const,
      source: "Universe" as const,
      universeId: gp.universeId,
      iconImageAssetId: gp.iconImageAssetId,
    }))

    const clothingAssets: RobloxAsset[] = clothingItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: assetThumbnails.get(item.id) || "",
      type: "Clothing" as const,
      source: "Catalog" as const,
      assetType: item.assetType,
    }))

    const ugcAssets: RobloxAsset[] = ugcItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: assetThumbnails.get(item.id) || "",
      type: "UGC" as const,
      source: "Catalog" as const,
      assetType: item.assetType,
    }))

    // Combine all assets
    const allAssets = [...universeAssets, ...gamePassAssets, ...clothingAssets, ...ugcAssets]
    const responseTime = Date.now() - startTime

    logApiRequest(request, 200, startTime, undefined, userId)

    // Return in a format compatible with both the website scanner and Roblox HttpService
    return NextResponse.json({
      success: true,
      userId: userIdNum,
      totalAssets: allAssets.length,
      assets: allAssets,
      universes: universeAssets,
      gamepasses: gamePassAssets,
      clothing: clothingAssets,
      ugc: ugcAssets,
      breakdown: {
        universes: universeAssets.length,
        gamePasses: gamePassAssets.length,
        clothing: clothingAssets.length,
        ugc: ugcAssets.length,
      },
      _meta: {
        responseTimeMs: responseTime,
        cached: responseTime < 200,
        version: "2.0.0",
      },
    })
  } catch (error) {
    console.error("Error fetching all assets:", error)
    logApiRequest(request, 500, startTime, undefined, userId)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch all assets",
      code: "FETCH_ERROR"
    }, { status: 500 })
  }
}
