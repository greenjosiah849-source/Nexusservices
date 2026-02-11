import { type NextRequest, NextResponse } from "next/server"
import { nexusStore, getRankDisplay, createSessionToken, parseSessionToken } from "@/lib/nexus-config"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const admin = nexusStore.admins.get(username.toUpperCase())

    if (!admin || admin.passwordHash !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = createSessionToken(admin.username)

    const cookieStore = await cookies()
    cookieStore.set("nexus_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: {
        username: admin.username,
        displayName: admin.displayName,
        rank: admin.rank,
        rankDisplay: getRankDisplay(admin.rank),
      },
    })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("nexus_session")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false })
    }

    const sessionData = parseSessionToken(token)

    if (!sessionData) {
      return NextResponse.json({ authenticated: false })
    }

    const admin = nexusStore.admins.get(sessionData.username)

    if (!admin) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: admin.username,
        displayName: admin.displayName,
        rank: admin.rank,
        rankDisplay: getRankDisplay(admin.rank),
      },
    })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("nexus_session")

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
