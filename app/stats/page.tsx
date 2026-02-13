"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Shield,
  Activity,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  Gamepad2,
  ArrowLeft,
} from "lucide-react"

interface PublicStats {
  apiEnabled: boolean
  totalRequests24h: number
  requestsPerHour: number
  requestsPerMinute: number
  avgResponseTime: number
  successRate: number
  endpointHealth: Array<{
    endpoint: string
    status: string
    avgResponseTime: number
  }>
  activePlatforms: Array<{
    name: string
    count: number
    lastSeen: string
    icon: string
  }>
  lastUpdated: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/nexus/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />
      default:
        return <XCircle className="w-5 h-5 text-zinc-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading stats...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Nexus Services - API Stats</h1>
                <p className="text-xs text-zinc-500">Real-time public statistics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-500">
                Last updated: {stats ? new Date(stats.lastUpdated).toLocaleTimeString() : "---"}
              </p>
              <Button variant="outline" size="sm" onClick={fetchStats} className="border-zinc-600 bg-transparent">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* API Status Banner */}
        <Card
          className={`mb-8 border-2 ${stats?.apiEnabled ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/50 bg-red-500/5"}`}
        >
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`w-6 h-6 rounded-full ${stats?.apiEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
              />
              <h2 className="text-3xl font-bold">API Status: {stats?.apiEnabled ? "Operational" : "Offline"}</h2>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.totalRequests24h.toLocaleString() || 0}</p>
                  <p className="text-sm text-zinc-500">Total Requests (24h)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Activity className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.requestsPerMinute || 0}</p>
                  <p className="text-sm text-zinc-500">Requests/Minute</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.avgResponseTime || 0}ms</p>
                  <p className="text-sm text-zinc-500">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats?.successRate || 100}%</p>
                  <p className="text-sm text-zinc-500">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Endpoint Health */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Endpoint Health</CardTitle>
              <CardDescription className="text-zinc-400">Real-time status of all API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.endpointHealth?.map((endpoint) => (
                  <div
                    key={endpoint.endpoint}
                    className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <span className="font-mono text-sm">{endpoint.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-500">{endpoint.avgResponseTime}ms</span>
                      <Badge
                        className={
                          endpoint.status === "healthy"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : endpoint.status === "degraded"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-zinc-600 text-zinc-400"
                        }
                      >
                        {endpoint.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Platforms */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Active Platforms</CardTitle>
              <CardDescription className="text-zinc-400">Services currently using the API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.activePlatforms && stats.activePlatforms.length > 0 ? (
                  stats.activePlatforms.map((platform) => (
                    <div
                      key={platform.name}
                      className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        {platform.name.toLowerCase() === "roblox" ? (
                          <img src="https://www.roblox.com/favicon.ico" alt="Roblox" className="w-8 h-8" />
                        ) : platform.name.toLowerCase() === "web" ? (
                          <Globe className="w-8 h-8 text-blue-400" />
                        ) : (
                          <Gamepad2 className="w-8 h-8 text-zinc-400" />
                        )}
                        <div>
                          <p className="font-medium">{platform.name}</p>
                          <p className="text-xs text-zinc-500">
                            Last seen: {new Date(platform.lastSeen).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{platform.count}</p>
                        <p className="text-xs text-zinc-500">requests</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No active platforms detected</p>
                    <p className="text-xs mt-1">Platforms will appear here when they make API requests</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
