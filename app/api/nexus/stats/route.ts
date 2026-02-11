import { NextResponse } from "next/server"
import { nexusStore } from "@/lib/nexus-config"

// Public stats endpoint - no auth required
export async function GET() {
  const stats = nexusStore.getStats()
  const endpointHealth = nexusStore.getEndpointHealth()

  // Get unique platforms using the API
  const recentLogs = nexusStore.usageLogs.slice(0, 1000)
  const platforms = new Map<string, { count: number; lastSeen: string; icon: string }>()

  recentLogs.forEach((log) => {
    const existing = platforms.get(log.platform)
    if (!existing) {
      platforms.set(log.platform, {
        count: 1,
        lastSeen: log.timestamp,
        icon:
          log.platform === "roblox"
            ? "https://www.roblox.com/favicon.ico"
            : log.platform === "web"
              ? "globe"
              : "unknown",
      })
    } else {
      existing.count++
      if (log.timestamp > existing.lastSeen) {
        existing.lastSeen = log.timestamp
      }
    }
  })

  return NextResponse.json({
    apiEnabled: nexusStore.apiStatus.enabled,
    totalRequests24h: stats.totalRequests24h,
    requestsPerHour: stats.requestsPerHour,
    requestsPerMinute: stats.requestsPerMinute,
    avgResponseTime: stats.avgResponseTime,
    successRate: stats.successRate,
    endpointHealth: endpointHealth.map((e) => ({
      endpoint: e.endpoint,
      status: e.status,
      avgResponseTime: e.avgResponseTime,
    })),
    activePlatforms: Array.from(platforms.entries()).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      ...data,
    })),
    lastUpdated: new Date().toISOString(),
  })
}
