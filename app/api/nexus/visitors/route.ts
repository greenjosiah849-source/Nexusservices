import { type NextRequest, NextResponse } from "next/server"
import { parseSessionToken, nexusStore, getRankLevel } from "@/lib/nexus-config"
import { cookies } from "next/headers"

declare global {
  var __nexusVisitorLogs:
    | Array<{
        id: string
        ip: string
        path: string
        userAgent: string
        timestamp: string
        country?: string
        city?: string
        referer?: string
        method: string
      }>
    | undefined
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("nexus_session")

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const session = parseSessionToken(sessionCookie.value)
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  const admin = nexusStore.admins.get(session.username)
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 401 })
  }

  if (getRankLevel(admin.rank) < 40) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "100")

  const logs = global.__nexusVisitorLogs || []

  const uniqueIPs = new Set(logs.map((l) => l.ip))
  const pageViews: Record<string, number> = {}
  const countryViews: Record<string, number> = {}

  logs.forEach((log) => {
    pageViews[log.path] = (pageViews[log.path] || 0) + 1
    if (log.country) {
      countryViews[log.country] = (countryViews[log.country] || 0) + 1
    }
  })

  return NextResponse.json({
    visitors: logs.slice(0, limit),
    stats: {
      totalVisits: logs.length,
      uniqueVisitors: uniqueIPs.size,
      pageViews,
      countryViews,
    },
  })
}
