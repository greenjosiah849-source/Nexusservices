import { type NextRequest, NextResponse } from "next/server"
import { getAllGamePassesByUserEnhanced, getGamePassIcons, type RobloxAsset } from "@/lib/roblox-api"
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

  try {
    const universeGamePasses = await getAllGamePassesByUserEnhanced(Number.parseInt(userId))

    const allGamePasses = universeGamePasses.flatMap((u) =>
      u.gamePasses.map((gp) => ({ ...gp, universeId: u.universeId })),
    )

    // Get icons in parallel
    const gamePassIds = allGamePasses.map((gp) => gp.id)
    const iconMap = await getGamePassIcons(gamePassIds)

    const gamepasses = allGamePasses.map((gamePass) => ({
      id: gamePass.id,
      name: gamePass.displayName || gamePass.name,
      price: gamePass.price,
      imageUrl: iconMap.get(gamePass.id) || "",
      iconImageAssetId: gamePass.iconImageAssetId,
      type: "GamePass" as const,
      source: "Universe" as const,
      universeId: gamePass.universeId,
    }))

    const responseTime = Date.now() - startTime
    logApiRequest(request, 200, startTime, undefined, userId)

    // Return format compatible with Roblox HttpService
    return NextResponse.json({
      success: true,
      userId: Number.parseInt(userId),
      count: gamepasses.length,
      gamepasses,
      _meta: { 
        responseTimeMs: responseTime, 
        cached: responseTime < 100,
        version: "2.0.0"
      },
    })
  } catch (error) {
    console.error("Error fetching game passes:", error)
    logApiRequest(request, 500, startTime, undefined, userId)
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch game passes",
      code: "FETCH_ERROR"
    }, { status: 500 })
  }
}
