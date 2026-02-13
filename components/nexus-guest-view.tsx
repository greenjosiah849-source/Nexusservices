"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Shield,
  Activity,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Server,
  Search,
  LogIn,
  Gamepad2,
  RefreshCw,
} from "lucide-react"

interface NexusGuestViewProps {
  onLogin: () => void
}

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

interface TestResult {
  endpoint: string
  status: "success" | "error" | "loading"
  statusCode?: number
  responseTime?: number
  data?: unknown
  error?: string
}

export function NexusGuestView({ onLogin }: NexusGuestViewProps) {
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map())
  const [testUsername, setTestUsername] = useState("")
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
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const testEndpoint = async (endpoint: string, params = "") => {
    const key = endpoint + params
    setTestResults((prev) => new Map(prev).set(key, { endpoint, status: "loading" }))

    const startTime = Date.now()
    try {
      const res = await fetch(`${endpoint}${params}`)
      const data = await res.json()
      const responseTime = Date.now() - startTime

      setTestResults((prev) =>
        new Map(prev).set(key, {
          endpoint,
          status: res.ok ? "success" : "error",
          statusCode: res.status,
          responseTime,
          data: res.ok ? data : undefined,
          error: !res.ok ? data.error || data.message : undefined,
        }),
      )
    } catch (error) {
      setTestResults((prev) =>
        new Map(prev).set(key, {
          endpoint,
          status: "error",
          error: error instanceof Error ? error.message : "Request failed",
        }),
      )
    }
  }

  const runAllTests = async () => {
    if (!testUsername) return
    const endpoints = [
      { path: "/api/roblox/user", params: `?username=${testUsername}` },
      { path: "/api/roblox/universes", params: "" },
      { path: "/api/roblox/gamepasses", params: "" },
      { path: "/api/roblox/clothing", params: "" },
      { path: "/api/roblox/ugc", params: "" },
    ]

    // Test user first to get userId
    await testEndpoint("/api/roblox/user", `?username=${testUsername}`)

    const userResult = testResults.get(`/api/roblox/user?username=${testUsername}`)
    if (userResult?.data && typeof userResult.data === "object" && "id" in userResult.data) {
      const userId = (userResult.data as { id: number }).id
      for (const ep of endpoints.slice(1)) {
        await testEndpoint(ep.path, `?userId=${userId}`)
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      default:
        return <XCircle className="w-4 h-4 text-zinc-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading...
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
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Nexus Services</h1>
                <p className="text-xs text-zinc-500">by Zauataun (Zap | ZAZEM)</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                Guest Mode
              </Badge>
              <Button onClick={onLogin} variant="outline" className="border-zinc-600 bg-transparent">
                <LogIn className="w-4 h-4 mr-2" />
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="status">
          <TabsList className="bg-zinc-800 border-zinc-700 mb-6">
            <TabsTrigger value="status" className="data-[state=active]:bg-zinc-700">
              <Activity className="w-4 h-4 mr-2" />
              API Status
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-zinc-700">
              <Server className="w-4 h-4 mr-2" />
              Test Endpoints
            </TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            {/* API Status Banner */}
            <Card
              className={`border-2 ${stats?.apiEnabled ? "border-emerald-500/50 bg-emerald-500/5" : "border-red-500/50 bg-red-500/5"}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-4 h-4 rounded-full ${stats?.apiEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <div>
                      <h2 className="text-xl font-bold">API is {stats?.apiEnabled ? "Online" : "Offline"}</h2>
                      <p className="text-sm text-zinc-400">
                        {stats?.apiEnabled ? "All systems operational" : "API is currently disabled by administrators"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Last updated: {stats ? new Date(stats.lastUpdated).toLocaleTimeString() : "---"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.totalRequests24h || 0}</p>
                      <p className="text-xs text-zinc-500">Requests (24h)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.requestsPerMinute || 0}</p>
                      <p className="text-xs text-zinc-500">Requests/min</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</p>
                      <p className="text-xs text-zinc-500">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.successRate || 100}%</p>
                      <p className="text-xs text-zinc-500">Success Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Endpoint Health */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Endpoint Health</CardTitle>
                <CardDescription className="text-zinc-400">Current status of all API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.endpointHealth?.map((endpoint) => (
                    <div
                      key={endpoint.endpoint}
                      className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg"
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
                <div className="flex gap-4 flex-wrap">
                  {stats?.activePlatforms && stats.activePlatforms.length > 0 ? (
                    stats.activePlatforms.map((platform) => (
                      <div key={platform.name} className="flex items-center gap-3 p-4 bg-zinc-700/50 rounded-lg">
                        {platform.name.toLowerCase() === "roblox" ? (
                          <img src="https://www.roblox.com/favicon.ico" alt="Roblox" className="w-8 h-8" />
                        ) : platform.name.toLowerCase() === "web" ? (
                          <Globe className="w-8 h-8 text-blue-400" />
                        ) : (
                          <Gamepad2 className="w-8 h-8 text-zinc-400" />
                        )}
                        <div>
                          <p className="font-medium">{platform.name}</p>
                          <p className="text-xs text-zinc-500">{platform.count} requests</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">No active platforms detected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Endpoints Tab */}
          <TabsContent value="test" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Test API Endpoints</CardTitle>
                <CardDescription className="text-zinc-400">
                  Enter a Roblox username to test all API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Input
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="Enter Roblox username"
                    className="bg-zinc-700 border-zinc-600"
                  />
                  <Button onClick={runAllTests} disabled={!testUsername} className="bg-cyan-600 hover:bg-cyan-700">
                    <Search className="w-4 h-4 mr-2" />
                    Test All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            {testResults.size > 0 && (
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.from(testResults.entries()).map(([key, result]) => (
                      <div key={key} className="p-4 bg-zinc-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {result.status === "loading" ? (
                              <RefreshCw className="w-4 h-4 text-zinc-400 animate-spin" />
                            ) : result.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span className="font-mono text-sm">{key}</span>
                          </div>
                          {result.statusCode && (
                            <div className="flex items-center gap-3">
                              <Badge
                                className={
                                  result.statusCode < 400
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                }
                              >
                                {result.statusCode}
                              </Badge>
                              {result.responseTime && (
                                <span className="text-sm text-zinc-500">{result.responseTime}ms</span>
                              )}
                            </div>
                          )}
                        </div>
                        {result.error && <p className="text-sm text-red-400">{result.error}</p>}
                        {result.data && (
                          <pre className="mt-2 p-2 bg-zinc-800 rounded text-xs text-zinc-300 overflow-auto max-h-32">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
