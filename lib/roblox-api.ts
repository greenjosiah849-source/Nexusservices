// Types for Roblox API responses
export interface RobloxAsset {
  id: number
  name: string
  price: number | null
  imageUrl: string
  type: "GamePass" | "Clothing" | "UGC" | "Universe" | "Place"
  source: "Universe" | "Catalog"
  universeId?: number
  iconImageAssetId?: number
}

export interface Universe {
  id: number
  name: string
  description: string
  creatorType: string
  creatorTargetId: number
  created: string
  updated: string
  isActive: boolean
  rootPlaceId?: number
}

export interface Place {
  id: number
  universeId: number
  name: string
  description: string
}

export interface GamePass {
  id: number
  name: string
  displayName?: string
  productId?: number
  price: number | null
  sellerName?: string
  sellerId?: number
  isOwned?: boolean
  description?: string
  iconId?: number
  iconImageAssetId?: number
  universeId?: number
}

export interface CatalogItem {
  id: number
  itemType: string
  name: string
  description: string
  price: number | null
  creatorType: string
  creatorTargetId: number
  creatorName: string
  assetType?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  nextPageCursor: string | null
  previousPageCursor: string | null
}

export interface GameFromSearch {
  creatorId: number
  creatorName: string
  creatorType: string
  creatorHasVerifiedBadge: boolean
  totalUpVotes: number
  totalDownVotes: number
  universeId: number
  name: string
  placeId: number
  playerCount: number
  imageToken: string
  isSponsored: boolean
  nativeAdData: string
  isShowSponsoredLabel: boolean
  price: number | null
  analyticsIdentifier: string | null
  gameDescription: string
  genre: string
  minimumAge: number
  ageRecommendationDisplayName: string
}

declare global {
  var __robloxRequestCache: Map<string, { data: unknown; timestamp: number }> | undefined
  var __robloxLastRequestTime: number | undefined
}

if (!global.__robloxRequestCache) {
  global.__robloxRequestCache = new Map()
}

if (!global.__robloxLastRequestTime) {
  global.__robloxLastRequestTime = 0
}

const CACHE_TTL = 300000
const MIN_REQUEST_INTERVAL = 25

async function rateLimitedFetch<T>(url: string, options?: RequestInit, retries = 4): Promise<T | null> {
  const cache = global.__robloxRequestCache!
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }

  const now = Date.now()
  const timeSinceLastRequest = now - global.__robloxLastRequestTime!
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  global.__robloxLastRequestTime = Date.now()

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      })

      clearTimeout(timeoutId)

      if (response.status === 429) {
        const backoffTime = Math.pow(2, attempt) * 500
        await new Promise((resolve) => setTimeout(resolve, backoffTime))
        continue
      }

      if (!response.ok) {
        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          continue
        }
        return null
      }

      const data = await response.json()
      cache.set(url, { data, timestamp: Date.now() })
      return data
    } catch {
      if (attempt === retries - 1) return null
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  return null
}

async function fetchRoblox<T>(url: string, options?: RequestInit): Promise<T | null> {
  return rateLimitedFetch<T>(url, options)
}

export function clearCache() {
  global.__robloxRequestCache?.clear()
}

export async function getGamesBySearch(userId: number): Promise<number[]> {
  const universeIds: number[] = []
  const url = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&sortOrder=Asc&limit=50`

  const response = await fetchRoblox<{
    data: Array<{ id: number; name: string; rootPlace?: { id: number } }>
    nextPageCursor: string | null
  }>(url)

  if (response?.data) {
    response.data.forEach((game) => universeIds.push(game.id))
  }

  return universeIds
}

export async function getAllUniverseIds(userId: number): Promise<number[]> {
  return getGamesBySearch(userId)
}

export async function getUniversesByCreator(userId: number, cursor?: string): Promise<PaginatedResponse<Universe>> {
  const url = new URL(`https://games.roblox.com/v2/users/${userId}/games`)
  url.searchParams.set("accessFilter", "Public")
  url.searchParams.set("sortOrder", "Asc")
  url.searchParams.set("limit", "50")
  if (cursor) url.searchParams.set("cursor", cursor)

  const result = await fetchRoblox<{
    data: Array<{
      id: number
      name: string
      description: string
      creator: { type: string; id: number }
      created: string
      updated: string
    }>
    nextPageCursor: string | null
    previousPageCursor: string | null
  }>(url.toString())

  if (!result?.data) {
    return { data: [], nextPageCursor: null, previousPageCursor: null }
  }

  const universes: Universe[] = result.data.map((game) => ({
    id: game.id,
    name: game.name,
    description: game.description || "",
    creatorType: game.creator?.type || "User",
    creatorTargetId: game.creator?.id || userId,
    created: game.created || new Date().toISOString(),
    updated: game.updated || new Date().toISOString(),
    isActive: true,
  }))

  return {
    data: universes,
    nextPageCursor: result.nextPageCursor,
    previousPageCursor: result.previousPageCursor,
  }
}

export async function getPlacesByUniverse(universeId: number): Promise<PaginatedResponse<Place>> {
  const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`
  const result = await fetchRoblox<{
    data: Array<{
      id: number
      rootPlaceId: number
      name: string
      description: string
    }>
  }>(url)

  if (!result?.data || result.data.length === 0) {
    return { data: [], nextPageCursor: null, previousPageCursor: null }
  }

  const places: Place[] = result.data.map((game) => ({
    id: game.rootPlaceId,
    universeId: game.id,
    name: game.name,
    description: game.description || "",
  }))

  return { data: places, nextPageCursor: null, previousPageCursor: null }
}

export async function getGamePassesByUniverse(universeId: number, _rootPlaceId?: number): Promise<GamePass[]> {
  // Method 1: Legacy games.roblox.com endpoint - most reliable for server-side fetching
  const allGamePasses: GamePass[] = []
  let cursor: string | undefined = undefined

  do {
    const url = new URL(`https://games.roblox.com/v1/games/${universeId}/game-passes`)
    url.searchParams.set("sortOrder", "Asc")
    url.searchParams.set("limit", "100")
    if (cursor) url.searchParams.set("cursor", cursor)

    const response = await fetchRoblox<{
      data?: Array<{
        id: number
        name: string
        displayName?: string
        description?: string
        price: number | null
        sellerName?: string
        sellerId?: number
        productId?: number
        iconImageAssetId?: number
      }>
      nextPageCursor?: string | null
      previousPageCursor?: string | null
    }>(url.toString())

    if (response?.data && response.data.length > 0) {
      for (const gp of response.data) {
        allGamePasses.push({
          id: gp.id,
          name: gp.displayName || gp.name,
          displayName: gp.displayName || gp.name,
          description: gp.description,
          price: gp.price,
          sellerName: gp.sellerName,
          sellerId: gp.sellerId,
          productId: gp.productId,
          iconImageAssetId: gp.iconImageAssetId,
          universeId,
        })
      }
      cursor = response.nextPageCursor || undefined
    } else {
      cursor = undefined
    }
  } while (cursor)

  if (allGamePasses.length > 0) {
    return allGamePasses
  }

  // Method 2: Fallback to apis.roblox.com endpoint
  const url2 = `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?sortOrder=Asc&limit=100`
  const response2 = await fetchRoblox<{
    pageItems?: Array<{
      id: number
      name: string
      displayName?: string
      description?: string
      price: number | null
      iconId?: number
      productId?: number
    }>
    data?: Array<{
      id: number
      name: string
      displayName?: string
      description?: string
      price: number | null
      iconId?: number
      productId?: number
    }>
  }>(url2)

  const items2 = response2?.pageItems || response2?.data
  if (items2 && items2.length > 0) {
    return items2.map((gp) => ({
      id: gp.id,
      name: gp.displayName || gp.name,
      displayName: gp.displayName || gp.name,
      description: gp.description,
      price: gp.price,
      iconId: gp.iconId,
      productId: gp.productId,
      iconImageAssetId: gp.iconId,
      universeId,
    }))
  }

  return []
}

export async function getAllGamePassesByUser(
  userId: number,
): Promise<{ gamePasses: GamePass[]; universeId: number }[]> {
  // First get all universes with their root place IDs
  const url = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&sortOrder=Asc&limit=50`
  const response = await fetchRoblox<{
    data: Array<{ id: number; name: string; rootPlace?: { id: number } }>
  }>(url)

  if (!response?.data || response.data.length === 0) return []

  const results: { gamePasses: GamePass[]; universeId: number }[] = []

  // Process in batches of 3 to avoid rate limiting
  for (let i = 0; i < response.data.length; i += 3) {
    const batch = response.data.slice(i, i + 3)
    const batchResults = await Promise.all(
      batch.map(async (game) => {
        const gamePasses = await getGamePassesByUniverse(game.id, game.rootPlace?.id)
        return { gamePasses, universeId: game.id }
      }),
    )
    results.push(...batchResults.filter((r) => r.gamePasses.length > 0))
    
    if (i + 3 < response.data.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return results
}

export async function getGamePassesByUniverseEnhanced(universeId: number): Promise<GamePass[]> {
  return getGamePassesByUniverse(universeId)
}

export async function getAllGamePassesByUserEnhanced(
  userId: number,
): Promise<{ gamePasses: GamePass[]; universeId: number }[]> {
  return getAllGamePassesByUser(userId)
}

export async function getGamePassIcon(gamePassId: number): Promise<string> {
  const url = `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${gamePassId}&size=150x150&format=Png&isCircular=false`
  const response = await fetchRoblox<{ data: Array<{ targetId: number; imageUrl: string }> }>(url)
  return response?.data[0]?.imageUrl || ""
}

export async function getGamePassIcons(gamePassIds: number[]): Promise<Map<number, string>> {
  if (gamePassIds.length === 0) return new Map()

  const map = new Map<number, string>()
  const batchSize = 100

  const batches = []
  for (let i = 0; i < gamePassIds.length; i += batchSize) {
    batches.push(gamePassIds.slice(i, i + batchSize))
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const url = `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${batch.join(",")}&size=150x150&format=Png&isCircular=false`
      return fetchRoblox<{ data: Array<{ targetId: number; imageUrl: string }> }>(url)
    }),
  )

  results.forEach((response) => {
    response?.data?.forEach((item) => {
      map.set(item.targetId, item.imageUrl)
    })
  })

  return map
}

export async function getClothingByCreator(
  userId: number,
  cursor?: string,
): Promise<{ data: CatalogItem[]; nextPageCursor: string | null }> {
  const url = new URL("https://catalog.roblox.com/v1/search/items/details")
  url.searchParams.set("Category", "3")
  url.searchParams.set("CreatorType", "User")
  url.searchParams.set("CreatorTargetId", userId.toString())
  url.searchParams.set("SalesTypeFilter", "1")
  url.searchParams.set("Limit", "30")
  if (cursor) url.searchParams.set("Cursor", cursor)

  const result = await fetchRoblox<{ data: CatalogItem[]; nextPageCursor: string | null }>(url.toString())
  return result || { data: [], nextPageCursor: null }
}

export async function getUGCByCreator(
  userId: number,
  cursor?: string,
): Promise<{ data: CatalogItem[]; nextPageCursor: string | null }> {
  const url = new URL("https://catalog.roblox.com/v1/search/items/details")
  url.searchParams.set("CreatorType", "User")
  url.searchParams.set("CreatorTargetId", userId.toString())
  url.searchParams.set("Category", "11")
  url.searchParams.set("IncludeNotForSale", "false")
  url.searchParams.set("Limit", "30")
  if (cursor) url.searchParams.set("Cursor", cursor)

  const result = await fetchRoblox<{ data: CatalogItem[]; nextPageCursor: string | null }>(url.toString())
  return result || { data: [], nextPageCursor: null }
}

export async function getAssetThumbnails(assetIds: number[]): Promise<Map<number, string>> {
  if (assetIds.length === 0) return new Map()

  const map = new Map<number, string>()
  const batchSize = 100

  const batches = []
  for (let i = 0; i < assetIds.length; i += batchSize) {
    batches.push(assetIds.slice(i, i + batchSize))
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const url = `https://thumbnails.roblox.com/v1/assets?assetIds=${batch.join(",")}&size=420x420&format=Png&isCircular=false`
      return fetchRoblox<{ data: Array<{ targetId: number; imageUrl: string }> }>(url)
    }),
  )

  results.forEach((response) => {
    response?.data?.forEach((item) => {
      map.set(item.targetId, item.imageUrl)
    })
  })

  return map
}

export async function getUserByUsername(username: string): Promise<{ id: number; name: string } | null> {
  const url = "https://users.roblox.com/v1/usernames/users"
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.data && data.data.length > 0) {
      return { id: data.data[0].id, name: data.data[0].name }
    }
    return null
  } catch {
    return null
  }
}

export async function fetchAllPaginated<T>(fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>): Promise<T[]> {
  const allData: T[] = []
  let cursor: string | undefined = undefined

  do {
    const response = await fetchFn(cursor)
    allData.push(...response.data)
    cursor = response.nextPageCursor || undefined
  } while (cursor)

  return allData
}

export async function fetchAllPaginatedSafe<T>(
  fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>,
): Promise<T[]> {
  const allData: T[] = []
  let cursor: string | undefined = undefined

  try {
    do {
      const response = await fetchFn(cursor)
      if (!response || !response.data) break
      allData.push(...response.data)
      cursor = response.nextPageCursor || undefined
    } while (cursor)
  } catch {
    // Return what we have
  }

  return allData
}
