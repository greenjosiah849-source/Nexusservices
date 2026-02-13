import { type NextRequest, NextResponse } from "next/server"
import {
  nexusStore,
  getRankDisplay,
  getRankLevel,
  parseSessionToken,
  logAdminAction,
  type NexusAdmin,
} from "@/lib/nexus-config"
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
  var __nexusSupportTickets:
    | Array<{
        id: string
        title: string
        description: string
        category: string
        status: string
        priority: string
        createdBy: string
        createdAt: string
        updatedAt: string
        messages: Array<{
          id: string
          content: string
          author: string
          isStaff: boolean
          createdAt: string
        }>
        assignedTo?: string
      }>
    | undefined
}

async function verifyAdmin(request: NextRequest): Promise<NexusAdmin | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("nexus_session")?.value

  if (!token) return null

  const sessionData = parseSessionToken(token)
  if (!sessionData) return null

  return nexusStore.admins.get(sessionData.username) || null
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  switch (action) {
    case "status":
      return NextResponse.json({
        apiStatus: nexusStore.apiStatus,
        stats: nexusStore.getStats(),
        endpointHealth: nexusStore.getEndpointHealth(),
      })

    case "logs":
      const limit = Math.min(Number(searchParams.get("limit")) || 100, 500)
      return NextResponse.json({
        logs: nexusStore.usageLogs.slice(0, limit),
        total: nexusStore.usageLogs.length,
      })

    case "admin-logs":
      const adminLogLimit = Math.min(Number(searchParams.get("limit")) || 100, 500)
      return NextResponse.json({
        logs: nexusStore.adminLogs.slice(0, adminLogLimit),
        total: nexusStore.adminLogs.length,
      })

    case "visitors":
      if (getRankLevel(admin.rank) < 40) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      const visitorLimit = Math.min(Number(searchParams.get("limit")) || 100, 500)
      const visitors = global.__nexusVisitorLogs || []
      const uniqueIPs = new Set(visitors.map((v) => v.ip))
      return NextResponse.json({
        visitors: visitors.slice(0, visitorLimit),
        total: visitors.length,
        uniqueVisitors: uniqueIPs.size,
      })

    case "admins":
      if (getRankLevel(admin.rank) < 80) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      const admins = Array.from(nexusStore.admins.values()).map((a) => ({
        username: a.username,
        displayName: a.displayName,
        rank: a.rank,
        rankDisplay: getRankDisplay(a.rank),
        createdAt: a.createdAt,
      }))
      return NextResponse.json({ admins })

    case "blocked-sessions":
      return NextResponse.json({
        blockedSessions: Array.from(nexusStore.blockedSessions.values()),
      })

    case "support-tickets":
      if (getRankLevel(admin.rank) < 40) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      const tickets = global.__nexusSupportTickets || []
      return NextResponse.json({
        tickets,
        stats: {
          total: tickets.length,
          open: tickets.filter((t) => t.status === "open").length,
          inProgress: tickets.filter((t) => t.status === "in-progress").length,
          resolved: tickets.filter((t) => t.status === "resolved").length,
        },
      })

    default:
      return NextResponse.json({
        apiStatus: nexusStore.apiStatus,
        stats: nexusStore.getStats(),
      })
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request)

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case "toggle-api":
        if (getRankLevel(admin.rank) < 60) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        const newStatus = !nexusStore.apiStatus.enabled
        nexusStore.apiStatus = {
          enabled: newStatus,
          lastToggled: new Date().toISOString(),
          toggledBy: admin.username,
        }
        logAdminAction("toggle-api", admin.username, `API ${newStatus ? "enabled" : "disabled"}`)
        return NextResponse.json({
          success: true,
          apiStatus: nexusStore.apiStatus,
        })

      case "block-session":
        if (getRankLevel(admin.rank) < 40) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        const { sessionId, gameId, reason } = body
        const blockKey = gameId ? `game_${gameId}` : sessionId
        nexusStore.blockedSessions.set(blockKey, {
          sessionId: blockKey,
          gameId,
          reason: reason || "Blocked by admin",
          blockedAt: new Date().toISOString(),
          blockedBy: admin.username,
        })
        logAdminAction("block-session", admin.username, `Blocked game ${gameId || sessionId}: ${reason}`)
        return NextResponse.json({ success: true })

      case "unblock-session":
        if (getRankLevel(admin.rank) < 40) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        const { sessionIdToUnblock } = body
        nexusStore.blockedSessions.delete(sessionIdToUnblock)
        logAdminAction("unblock-session", admin.username, `Unblocked session ${sessionIdToUnblock}`)
        return NextResponse.json({ success: true })

      case "add-admin":
        if (getRankLevel(admin.rank) < 100) {
          return NextResponse.json({ error: "Only founders can add admins" }, { status: 403 })
        }
        const { newUsername, newPassword, newRank, newDisplayName } = body
        if (nexusStore.admins.has(newUsername.toUpperCase())) {
          return NextResponse.json({ error: "Admin already exists" }, { status: 400 })
        }
        nexusStore.admins.set(newUsername.toUpperCase(), {
          username: newUsername.toUpperCase(),
          passwordHash: newPassword,
          rank: newRank || "moderator",
          displayName: newDisplayName || newUsername,
          createdAt: new Date().toISOString(),
        })
        logAdminAction("add-admin", admin.username, `Added admin ${newUsername} with rank ${newRank}`)
        return NextResponse.json({ success: true })

      case "remove-admin":
        if (getRankLevel(admin.rank) < 100) {
          return NextResponse.json({ error: "Only founders can remove admins" }, { status: 403 })
        }
        const { usernameToRemove } = body
        if (usernameToRemove.toUpperCase() === admin.username) {
          return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 })
        }
        nexusStore.admins.delete(usernameToRemove.toUpperCase())
        logAdminAction("remove-admin", admin.username, `Removed admin ${usernameToRemove}`)
        return NextResponse.json({ success: true })

      case "clear-logs":
        if (getRankLevel(admin.rank) < 80) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        nexusStore.usageLogs = []
        logAdminAction("clear-logs", admin.username, "Cleared all API usage logs")
        return NextResponse.json({ success: true })

      case "clear-visitors":
        if (getRankLevel(admin.rank) < 80) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        global.__nexusVisitorLogs = []
        logAdminAction("clear-visitors", admin.username, "Cleared all visitor logs")
        return NextResponse.json({ success: true })

      case "update-ticket":
        if (getRankLevel(admin.rank) < 40) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
        }
        const { ticketId, status: ticketStatus, assignTo, reply } = body
        const tickets = global.__nexusSupportTickets || []
        const ticketIndex = tickets.findIndex((t) => t.id === ticketId)
        
        if (ticketIndex === -1) {
          return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
        }
        
        if (ticketStatus) {
          tickets[ticketIndex].status = ticketStatus
        }
        if (assignTo) {
          tickets[ticketIndex].assignedTo = assignTo
        }
        if (reply) {
          tickets[ticketIndex].messages.push({
            id: `MSG-${Date.now()}`,
            content: reply,
            author: admin.displayName,
            isStaff: true,
            createdAt: new Date().toISOString(),
          })
        }
        tickets[ticketIndex].updatedAt = new Date().toISOString()
        
        logAdminAction("update-ticket", admin.username, `Updated ticket ${ticketId}`)
        return NextResponse.json({ success: true, ticket: tickets[ticketIndex] })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin action error:", error)
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
