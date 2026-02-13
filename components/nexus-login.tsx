"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, Eye, EyeOff, Zap, Lock } from "lucide-react"

interface NexusLoginProps {
  onLogin: (user: { username: string; displayName: string; rank: string; rankDisplay: string }) => void
  onGuest: () => void
}

export function NexusLogin({ onLogin, onGuest }: NexusLoginProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/nexus/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Login failed")
      }

      onLogin(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 backdrop-blur-xl relative z-10 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          {/* Logo section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center border-2 border-zinc-900">
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  NS | AS-LogIn
                </span>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Nexus Services
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Administrative Service Log In
              </CardDescription>
            </div>
          </div>

          {/* Branding */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
            <Shield className="w-3 h-3" />
            <span>Powered by Zauataun (Zap | ZAZEM)</span>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300 text-sm font-medium">
                Admin Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20 h-11"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20 pr-10 h-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white h-11 font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Sign In to Admin Panel
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={onGuest}
              className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white bg-transparent h-11"
            >
              Continue as Guest
            </Button>
            <p className="text-xs text-zinc-600 text-center mt-3">
              Guests can view API documentation, stats, and use the support system
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-zinc-800/50 text-center">
            <p className="text-[10px] text-zinc-700 uppercase tracking-wider">
              Nexus Services Authentication System v2.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
