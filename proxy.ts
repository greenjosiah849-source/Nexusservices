import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

declare global {
  var __nexusVisitorLogs: VisitorLog[] | undefined
  var __nexusRateLimits: Map<string, { count: number; resetAt: number }> | undefined
  var __nexusSecurityBlocks: Set<string> | undefined
}

interface VisitorLog {
  id: string
  ip: string
  path: string
  userAgent: string
  timestamp: string
  country?: string
  city?: string
  referer?: string
  method: string
}

if (!global.__nexusVisitorLogs) {
  global.__nexusVisitorLogs = []
}

if (!global.__nexusRateLimits) {
  global.__nexusRateLimits = new Map()
}

if (!global.__nexusSecurityBlocks) {
  global.__nexusSecurityBlocks = new Set()
}

const RATE_LIMIT_WINDOW = 60 * 1000
const RATE_LIMIT_MAX = 100

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfIP = request.headers.get("cf-connecting-ip")

  if (cfIP) return cfIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limits = global.__nexusRateLimits!

  const entry = limits.get(ip)
  if (!entry || entry.resetAt < now) {
    limits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return false
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX) {
    return true
  }

  return false
}

function logVisitor(request: NextRequest, ip: string) {
  const log: VisitorLog = {
    id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ip: ip,
    path: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent") || "unknown",
    timestamp: new Date().toISOString(),
    country: request.headers.get("cf-ipcountry") || request.geo?.country || undefined,
    city: request.geo?.city || undefined,
    referer: request.headers.get("referer") || undefined,
    method: request.method,
  }

  global.__nexusVisitorLogs!.unshift(log)
  if (global.__nexusVisitorLogs!.length > 5000) {
    global.__nexusVisitorLogs = global.__nexusVisitorLogs!.slice(0, 5000)
  }
}

const BLOCKED_PATTERNS = [
  /\.php$/i,
  /\.asp$/i,
  /\.aspx$/i,
  /wp-admin/i,
  /wp-login/i,
  /xmlrpc/i,
  /\.env$/i,
  /\.git/i,
  /\.sql$/i,
  /admin\.php/i,
  /phpmyadmin/i,
  /\.bak$/i,
  /\.config$/i,
  /eval\(/i,
  /base64_decode/i,
  /<script/i,
  /javascript:/i,
  /\.\.\//,
  /%2e%2e/i,
  /\/etc\/passwd/i,
  /union.*select/i,
  /insert.*into/i,
  /drop.*table/i,
]

function isMaliciousRequest(request: NextRequest): boolean {
  const path = request.nextUrl.pathname + request.nextUrl.search
  const userAgent = request.headers.get("user-agent") || ""

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(path) || pattern.test(userAgent)) {
      return true
    }
  }

  return false
}

export default function middleware(request: NextRequest) {
  const ip = getClientIP(request)
  const path = request.nextUrl.pathname

  if (global.__nexusSecurityBlocks!.has(ip)) {
    return new NextResponse(JSON.stringify({ error: "Access Denied", code: "ZTN_ERR_BLOCKED" }), {
      status: 403,
      headers: {
        "Content-Type": "application/json",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
      },
    })
  }

  if (isMaliciousRequest(request)) {
    global.__nexusSecurityBlocks!.add(ip)
    return new NextResponse(JSON.stringify({ error: "Forbidden", code: "ZTN_ERR_SECURITY" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (path.startsWith("/api/") && isRateLimited(ip)) {
    return new NextResponse(JSON.stringify({ error: "Too Many Requests", code: "ZTN_ERR_RATE_LIMIT" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    })
  }

  logVisitor(request, ip)

  const response = NextResponse.next()

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://*.roblox.com https://*.rbxcdn.com https://*.vercel.app; frame-ancestors 'none';",
  )
  response.headers.set("X-Powered-By", "Nexus Services by Zauataun")
  response.headers.set("X-Nexus-Version", "1.0.0")

  if (path.startsWith("/api/nexus/") || path.includes("_internal")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private")
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.png$|.*\\.svg$|.*\\.ico$).*)"],
}
