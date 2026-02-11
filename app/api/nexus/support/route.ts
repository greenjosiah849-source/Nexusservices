import { type NextRequest, NextResponse } from "next/server"
import { parseSessionToken, logAdminAction } from "@/lib/nexus-config"
import { cookies } from "next/headers"

export interface SupportTicket {
  id: string
  title: string
  description: string
  category: "api" | "account" | "bug" | "feature" | "other"
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdBy: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
  assignedTo?: string
}

export interface TicketMessage {
  id: string
  content: string
  author: string
  isStaff: boolean
  createdAt: string
}

declare global {
  var __nexusSupportTickets: SupportTicket[] | undefined
}

if (!globalThis.__nexusSupportTickets) {
  globalThis.__nexusSupportTickets = []
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ticketId = searchParams.get("ticketId")
  const status = searchParams.get("status")

  let tickets = globalThis.__nexusSupportTickets || []

  if (ticketId) {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }
    return NextResponse.json({ ticket })
  }

  if (status && status !== "all") {
    tickets = tickets.filter((t) => t.status === status)
  }

  return NextResponse.json({
    tickets: tickets.slice(0, 100),
    total: tickets.length,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ticketId, ...data } = body

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("nexus_session")
    const session = sessionCookie ? parseSessionToken(sessionCookie.value) : null

    if (action === "create") {
      const ticket: SupportTicket = {
        id: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        title: data.title,
        description: data.description,
        category: data.category || "other",
        status: "open",
        priority: data.priority || "medium",
        createdBy: session?.username || data.name || "Guest",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }

      globalThis.__nexusSupportTickets = globalThis.__nexusSupportTickets || []
      globalThis.__nexusSupportTickets.unshift(ticket)

      return NextResponse.json({ success: true, ticket })
    }

    if (action === "reply") {
      if (!ticketId || !data.content) {
        return NextResponse.json({ error: "Missing ticketId or content" }, { status: 400 })
      }

      const tickets = globalThis.__nexusSupportTickets || []
      const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

      if (ticketIndex === -1) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      const message: TicketMessage = {
        id: `MSG-${Date.now()}`,
        content: data.content,
        author: session?.username || data.name || "Guest",
        isStaff: !!session,
        createdAt: new Date().toISOString(),
      }

      tickets[ticketIndex].messages.push(message)
      tickets[ticketIndex].updatedAt = new Date().toISOString()

      if (session) {
        logAdminAction("TICKET_REPLY", session.username, `Replied to ticket ${ticketId}`)
      }

      return NextResponse.json({ success: true, message })
    }

    if (action === "update-status") {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const tickets = globalThis.__nexusSupportTickets || []
      const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

      if (ticketIndex === -1) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
      }

      tickets[ticketIndex].status = data.status
      tickets[ticketIndex].updatedAt = new Date().toISOString()

      if (data.assignedTo) {
        tickets[ticketIndex].assignedTo = data.assignedTo
      }

      logAdminAction("TICKET_STATUS", session.username, `Changed ticket ${ticketId} status to ${data.status}`)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Support API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
