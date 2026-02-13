"use client"

import { useState, useEffect } from "react"
import { NexusLogin } from "@/components/nexus-login"
import { NexusAdminPanel } from "@/components/nexus-admin-panel"
import { NexusGuestView } from "@/components/nexus-guest-view"
import { Loader2 } from "lucide-react"

type ViewState = "loading" | "login" | "guest" | "admin"

interface AdminUser {
  username: string
  displayName: string
  rank: string
  rankDisplay: string
}

export default function AdminPage() {
  const [viewState, setViewState] = useState<ViewState>("loading")
  const [user, setUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    // Check if already authenticated
    fetch("/api/nexus/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user)
          setViewState("admin")
        } else {
          setViewState("login")
        }
      })
      .catch(() => {
        setViewState("login")
      })
  }, [])

  const handleLogin = (loggedInUser: AdminUser) => {
    setUser(loggedInUser)
    setViewState("admin")
  }

  const handleLogout = () => {
    setUser(null)
    setViewState("login")
  }

  const handleGuest = () => {
    setViewState("guest")
  }

  const handleBackToLogin = () => {
    setViewState("login")
  }

  if (viewState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading Nexus Services...
        </div>
      </div>
    )
  }

  if (viewState === "login") {
    return <NexusLogin onLogin={handleLogin} onGuest={handleGuest} />
  }

  if (viewState === "guest") {
    return <NexusGuestView onLogin={handleBackToLogin} />
  }

  if (viewState === "admin" && user) {
    return <NexusAdminPanel user={user} onLogout={handleLogout} />
  }

  return null
}
