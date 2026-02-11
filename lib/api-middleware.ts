import { type NextRequest, NextResponse } from "next/server"
import { nexusStore, detectPlatform } from "./nexus-config"

export interface ApiContext {
  startTime: number
  platform: "roblox" | "web" | "unknown"
  userAgent: string
  ip: string
}

export function createApiResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function checkApiEnabled(request: NextRequest): NextResponse | null {
  if (!nexusStore.apiStatus.enabled) {
    const userAgent = request.headers.get("user-agent") || ""
    const platform = detectPlatform(userAgent)

    // Log the blocked request
    nexusStore.logUsage({
      endpoint: new URL(request.url).pathname,
      method: request.method,
      userAgent,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      timestamp: new Date().toISOString(),
      responseTime: 0,
      statusCode: 503,
      platform,
    })

    return NextResponse.json(
      {
        error: "Not Found",
        code: "ZTN_ERR_CODE_3",
        message: "Not Found, ZTN ERR CODE 3",
      },
      { status: 503 },
    )
  }
  return null
}

export function logApiRequest(
  request: NextRequest,
  statusCode: number,
  startTime: number,
  gameId?: string,
  userId?: string,
) {
  const userAgent = request.headers.get("user-agent") || ""
  const platform = detectPlatform(userAgent)

  nexusStore.logUsage({
    endpoint: new URL(request.url).pathname,
    method: request.method,
    userAgent,
    ip: request.headers.get("x-forwarded-for") || "unknown",
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    statusCode,
    platform,
    gameId,
    userId,
  })
}

export function checkBlockedSession(request: NextRequest): NextResponse | null {
  const gameId = request.headers.get("roblox-game-id") || request.nextUrl.searchParams.get("gameId")
  const sessionId = request.headers.get("x-session-id")

  if (gameId && nexusStore.blockedSessions.has(`game_${gameId}`)) {
    return NextResponse.json(
      {
        error: "Session Blocked",
        code: "ZTN_ERR_CODE_5",
        message: "This game session has been blocked by an administrator",
      },
      { status: 403 },
    )
  }

  if (sessionId && nexusStore.blockedSessions.has(sessionId)) {
    return NextResponse.json(
      {
        error: "Session Blocked",
        code: "ZTN_ERR_CODE_5",
        message: "This session has been blocked by an administrator",
      },
      { status: 403 },
    )
  }

  return null
}
