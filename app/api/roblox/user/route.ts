import { type NextRequest, NextResponse } from "next/server"
import { getUserByUsername } from "@/lib/roblox-api"
import { checkApiEnabled, logApiRequest, checkBlockedSession } from "@/lib/api-middleware"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  const apiCheck = checkApiEnabled(request)
  if (apiCheck) return apiCheck

  const sessionCheck = checkBlockedSession(request)
  if (sessionCheck) return sessionCheck

  const { searchParams } = new URL(request.url)
  const username = searchParams.get("username")

  if (!username) {
    logApiRequest(request, 400, startTime)
    return NextResponse.json({ error: "Username is required" }, { status: 400 })
  }

  try {
    const user = await getUserByUsername(username)

    if (!user) {
      logApiRequest(request, 404, startTime)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    logApiRequest(request, 200, startTime)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    logApiRequest(request, 500, startTime)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}
