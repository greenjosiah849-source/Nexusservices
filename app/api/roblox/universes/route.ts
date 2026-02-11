import { type NextRequest, NextResponse } from "next/server"
import { getUniversesByCreator, getPlacesByUniverse, type RobloxAsset } from "@/lib/roblox-api"
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
    const universesResponse = await getUniversesByCreator(Number.parseInt(userId), cursor)

    const assets: RobloxAsset[] = []

    for (const universe of universesResponse.data) {
      assets.push({
        id: universe.id,
        name: universe.name,
        price: null,
        imageUrl: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universe.id}&size=512x512&format=Png&isCircular=false`,
        type: "Universe",
        source: "Universe",
      })

      try {
        const placesResponse = await getPlacesByUniverse(universe.id)
        for (const place of placesResponse.data) {
          assets.push({
            id: place.id,
            name: place.name,
            price: null,
            imageUrl: `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${place.id}&size=512x512&format=Png&isCircular=false`,
            type: "Place",
            source: "Universe",
            universeId: universe.id,
          })
        }
      } catch (e) {
        console.error(`Failed to fetch places for universe ${universe.id}:`, e)
      }
    }

    logApiRequest(request, 200, startTime, undefined, userId)
    return NextResponse.json({
      data: assets,
      nextPageCursor: universesResponse.nextPageCursor,
      previousPageCursor: universesResponse.previousPageCursor,
    })
  } catch (error) {
    console.error("Error fetching universes:", error)
    logApiRequest(request, 500, startTime, undefined, userId)
    return NextResponse.json({ error: "Failed to fetch universes" }, { status: 500 })
  }
}
