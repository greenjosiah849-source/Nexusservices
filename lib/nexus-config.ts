export interface NexusAdmin {
  username: string
  passwordHash: string
  rank: "founder" | "site_manager" | "admin" | "moderator"
  displayName: string
  createdAt: string
}

export interface ApiUsageLog {
  id: string
  endpoint: string
  method: string
  userAgent: string
  ip: string
  timestamp: string
  responseTime: number
  statusCode: number
  platform: "roblox" | "web" | "unknown"
  gameId?: string
  userId?: string
}

export interface BlockedSession {
  sessionId: string
  gameId?: string
  userId?: string
  reason: string
  blockedAt: string
  blockedBy: string
}

export interface ApiStatus {
  enabled: boolean
  lastToggled: string
  toggledBy: string
}

export interface AdminActionLog {
  id: string
  action: string
  performedBy: string
  details: string
  timestamp: string
}

declare global {
  var __nexusApiStatus: ApiStatus | undefined
  var __nexusAdmins: Map<string, NexusAdmin> | undefined
  var __nexusUsageLogs: ApiUsageLog[] | undefined
  var __nexusBlockedSessions: Map<string, BlockedSession> | undefined
  var __nexusActiveSessions: Map<string, { token: string; username: string; expiresAt: number }> | undefined
  var __nexusAdminLogs: AdminActionLog[] | undefined
  var __nexusInitialized: boolean | undefined
}

function initializeGlobals() {
  if (global.__nexusInitialized) return

  if (!global.__nexusApiStatus) {
    global.__nexusApiStatus = {
      enabled: true,
      lastToggled: new Date().toISOString(),
      toggledBy: "system",
    }
  }

  if (!global.__nexusAdmins) {
    global.__nexusAdmins = new Map([
      [
        "ZA6VP",
        {
          username: "ZA6VP",
          passwordHash: "MACK11100",
          rank: "founder" as const,
          displayName: "ZA6VP",
          createdAt: new Date().toISOString(),
        },
      ],
    ])
  }

  if (!global.__nexusUsageLogs) {
    global.__nexusUsageLogs = []
  }

  if (!global.__nexusBlockedSessions) {
    global.__nexusBlockedSessions = new Map()
  }

  if (!global.__nexusActiveSessions) {
    global.__nexusActiveSessions = new Map()
  }

  if (!global.__nexusAdminLogs) {
    global.__nexusAdminLogs = []
  }

  global.__nexusInitialized = true
}

initializeGlobals()

export function createSessionToken(username: string): string {
  const token = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  const encoded = Buffer.from(
    JSON.stringify({
      username,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }),
  ).toString("base64")
  return encoded
}

export function parseSessionToken(encodedToken: string): { username: string; token: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(encodedToken, "base64").toString("utf-8")
    const data = JSON.parse(decoded)
    if (data.username && data.expiresAt && data.expiresAt > Date.now()) {
      return data
    }
  } catch (e) {
    return null
  }
  return null
}

export function logAdminAction(action: string, performedBy: string, details: string) {
  if (!global.__nexusAdminLogs) {
    global.__nexusAdminLogs = []
  }

  const log: AdminActionLog = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    performedBy,
    details,
    timestamp: new Date().toISOString(),
  }

  global.__nexusAdminLogs.unshift(log)
  if (global.__nexusAdminLogs.length > 1000) {
    global.__nexusAdminLogs = global.__nexusAdminLogs.slice(0, 1000)
  }
}

class NexusStore {
  private static instance: NexusStore

  get apiStatus(): ApiStatus {
    initializeGlobals()
    return global.__nexusApiStatus!
  }

  set apiStatus(value: ApiStatus) {
    global.__nexusApiStatus = value
  }

  get admins(): Map<string, NexusAdmin> {
    initializeGlobals()
    return global.__nexusAdmins!
  }

  get usageLogs(): ApiUsageLog[] {
    initializeGlobals()
    return global.__nexusUsageLogs!
  }

  set usageLogs(value: ApiUsageLog[]) {
    global.__nexusUsageLogs = value
  }

  get blockedSessions(): Map<string, BlockedSession> {
    initializeGlobals()
    return global.__nexusBlockedSessions!
  }

  get activeSessions(): Map<string, { token: string; username: string; expiresAt: number }> {
    initializeGlobals()
    return global.__nexusActiveSessions!
  }

  get adminLogs(): AdminActionLog[] {
    initializeGlobals()
    return global.__nexusAdminLogs!
  }

  private constructor() {}

  public static getInstance(): NexusStore {
    if (!NexusStore.instance) {
      NexusStore.instance = new NexusStore()
    }
    return NexusStore.instance
  }

  public logUsage(log: Omit<ApiUsageLog, "id">) {
    initializeGlobals()
    const entry: ApiUsageLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    global.__nexusUsageLogs!.unshift(entry)
    if (global.__nexusUsageLogs!.length > 10000) {
      global.__nexusUsageLogs = global.__nexusUsageLogs!.slice(0, 10000)
    }
  }

  public getStats() {
    initializeGlobals()
    const now = Date.now()
    const last24h = now - 24 * 60 * 60 * 1000
    const lastHour = now - 60 * 60 * 1000
    const lastMinute = now - 60 * 1000

    const logs = global.__nexusUsageLogs!
    const recentLogs = logs.filter((l) => new Date(l.timestamp).getTime() > last24h)
    const hourLogs = logs.filter((l) => new Date(l.timestamp).getTime() > lastHour)
    const minuteLogs = logs.filter((l) => new Date(l.timestamp).getTime() > lastMinute)

    const platformCounts = recentLogs.reduce(
      (acc, log) => {
        acc[log.platform] = (acc[log.platform] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const endpointCounts = recentLogs.reduce(
      (acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const avgResponseTime = recentLogs.length
      ? recentLogs.reduce((sum, l) => sum + l.responseTime, 0) / recentLogs.length
      : 0

    const successRate = recentLogs.length
      ? (recentLogs.filter((l) => l.statusCode >= 200 && l.statusCode < 400).length / recentLogs.length) * 100
      : 100

    return {
      totalRequests24h: recentLogs.length,
      requestsPerHour: hourLogs.length,
      requestsPerMinute: minuteLogs.length,
      platformCounts,
      endpointCounts,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100) / 100,
      apiEnabled: this.apiStatus.enabled,
    }
  }

  public getEndpointHealth() {
    initializeGlobals()
    const endpoints = [
      "/api/roblox/user",
      "/api/roblox/universes",
      "/api/roblox/gamepasses",
      "/api/roblox/clothing",
      "/api/roblox/ugc",
      "/api/roblox/all-assets",
    ]

    const logs = global.__nexusUsageLogs!

    return endpoints.map((endpoint) => {
      const recentLogs = logs.filter((l) => l.endpoint === endpoint).slice(0, 100)
      const errorCount = recentLogs.filter((l) => l.statusCode >= 400).length
      const avgTime = recentLogs.length ? recentLogs.reduce((sum, l) => sum + l.responseTime, 0) / recentLogs.length : 0

      return {
        endpoint,
        status: recentLogs.length === 0 ? "unknown" : errorCount > 10 ? "degraded" : ("healthy" as const),
        avgResponseTime: Math.round(avgTime),
        recentRequests: recentLogs.length,
        errorRate: recentLogs.length ? Math.round((errorCount / recentLogs.length) * 100) : 0,
      }
    })
  }
}

export const nexusStore = NexusStore.getInstance()

export function detectPlatform(userAgent: string): "roblox" | "web" | "unknown" {
  if (userAgent.toLowerCase().includes("roblox")) return "roblox"
  if (userAgent.includes("Mozilla") || userAgent.includes("Chrome") || userAgent.includes("Safari")) return "web"
  return "unknown"
}

export function getRankDisplay(rank: NexusAdmin["rank"]): string {
  const ranks = {
    founder: "Founder / Site Manager",
    site_manager: "Site Manager",
    admin: "Administrator",
    moderator: "Moderator",
  }
  return ranks[rank] || rank
}

export function getRankLevel(rank: NexusAdmin["rank"]): number {
  const levels = {
    founder: 100,
    site_manager: 80,
    admin: 60,
    moderator: 40,
  }
  return levels[rank] || 0
}
