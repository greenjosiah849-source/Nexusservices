"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Shield,
  Activity,
  Users,
  Ban,
  LogOut,
  RefreshCw,
  Globe,
  Gamepad2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Server,
  BarChart3,
  UserPlus,
  Trash2,
  Eye,
  MapPin,
  History,
} from "lucide-react"

interface AdminUser {
  username: string
  displayName: string
  rank: string
  rankDisplay: string
}

interface ApiStatus {
  enabled: boolean
  lastToggled: string
  toggledBy: string
}

interface Stats {
  totalRequests24h: number
  requestsPerHour: number
  requestsPerMinute: number
  avgResponseTime: number
  successRate: number
  platformCounts: Record<string, number>
  endpointCounts: Record<string, number>
}

interface EndpointHealth {
  endpoint: string
  status: "healthy" | "degraded" | "unknown"
  avgResponseTime: number
  recentRequests: number
  errorRate: number
}

interface UsageLog {
  id: string
  endpoint: string
  method: string
  userAgent: string
  ip: string
  timestamp: string
  responseTime: number
  statusCode: number
  platform: string
}

interface BlockedSession {
  sessionId: string
  gameId?: string
  reason: string
  blockedAt: string
  blockedBy: string
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

interface AdminActionLog {
  id: string
  action: string
  performedBy: string
  details: string
  timestamp: string
}

interface NexusAdminPanelProps {
  user: AdminUser
  onLogout: () => void
}

export function NexusAdminPanel({ user, onLogout }: NexusAdminPanelProps) {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [endpointHealth, setEndpointHealth] = useState<EndpointHealth[]>([])
  const [logs, setLogs] = useState<UsageLog[]>([])
  const [blockedSessions, setBlockedSessions] = useState<BlockedSession[]>([])
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [visitors, setVisitors] = useState<VisitorLog[]>([])
  const [visitorStats, setVisitorStats] = useState<{ totalVisits: number; uniqueVisitors: number }>({
    totalVisits: 0,
    uniqueVisitors: 0,
  })
  const [adminLogs, setAdminLogs] = useState<AdminActionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [newAdminUsername, setNewAdminUsername] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [newAdminRank, setNewAdminRank] = useState("moderator")
  const [newAdminDisplayName, setNewAdminDisplayName] = useState("")

  const [blockGameId, setBlockGameId] = useState("")
  const [blockReason, setBlockReason] = useState("")

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text })
    setTimeout(() => setFeedbackMessage(null), 3000)
  }

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, logsRes, blockedRes, adminsRes, visitorsRes, adminLogsRes] = await Promise.all([
        fetch("/api/nexus/admin?action=status"),
        fetch("/api/nexus/admin?action=logs&limit=100"),
        fetch("/api/nexus/admin?action=blocked-sessions"),
        fetch("/api/nexus/admin?action=admins"),
        fetch("/api/nexus/admin?action=visitors&limit=100"),
        fetch("/api/nexus/admin?action=admin-logs&limit=50"),
      ])

      if (statusRes.ok) {
        const data = await statusRes.json()
        setApiStatus(data.apiStatus)
        setStats(data.stats)
        setEndpointHealth(data.endpointHealth || [])
      }

      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs || [])
      }

      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlockedSessions(data.blockedSessions || [])
      }

      if (adminsRes.ok) {
        const data = await adminsRes.json()
        setAdmins(data.admins || [])
      }

      if (visitorsRes.ok) {
        const data = await visitorsRes.json()
        setVisitors(data.visitors || [])
        setVisitorStats({ totalVisits: data.total || 0, uniqueVisitors: data.uniqueVisitors || 0 })
      }

      if (adminLogsRes.ok) {
        const data = await adminLogsRes.json()
        setAdminLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const toggleApi = async () => {
    setIsToggling(true)
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-api" }),
      })
      if (res.ok) {
        const data = await res.json()
        setApiStatus(data.apiStatus)
        showFeedback("success", `API ${data.apiStatus.enabled ? "enabled" : "disabled"} successfully`)
        fetchData()
      } else {
        const err = await res.json()
        showFeedback("error", err.error || "Failed to toggle API")
      }
    } catch (error) {
      console.error("Failed to toggle API:", error)
      showFeedback("error", "Failed to toggle API")
    } finally {
      setIsToggling(false)
    }
  }

  const blockSession = async () => {
    if (!blockGameId) return
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block-session",
          gameId: blockGameId,
          reason: blockReason || "Blocked by admin",
        }),
      })
      if (res.ok) {
        showFeedback("success", "Game blocked successfully")
        setBlockGameId("")
        setBlockReason("")
        fetchData()
      } else {
        showFeedback("error", "Failed to block game")
      }
    } catch (error) {
      console.error("Failed to block session:", error)
      showFeedback("error", "Failed to block game")
    }
  }

  const unblockSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock-session", sessionIdToUnblock: sessionId }),
      })
      if (res.ok) {
        showFeedback("success", "Game unblocked successfully")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to unblock session:", error)
    }
  }

  const addAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      showFeedback("error", "Username and password are required")
      return
    }
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-admin",
          newUsername: newAdminUsername,
          newPassword: newAdminPassword,
          newRank: newAdminRank,
          newDisplayName: newAdminDisplayName || newAdminUsername,
        }),
      })
      if (res.ok) {
        showFeedback("success", `Admin "${newAdminUsername}" added successfully`)
        setNewAdminUsername("")
        setNewAdminPassword("")
        setNewAdminDisplayName("")
        fetchData()
      } else {
        const err = await res.json()
        showFeedback("error", err.error || "Failed to add admin")
      }
    } catch (error) {
      console.error("Failed to add admin:", error)
      showFeedback("error", "Failed to add admin")
    }
  }

  const removeAdmin = async (username: string) => {
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove-admin", usernameToRemove: username }),
      })
      if (res.ok) {
        showFeedback("success", `Admin "${username}" removed`)
        fetchData()
      }
    } catch (error) {
      console.error("Failed to remove admin:", error)
    }
  }

  const clearVisitors = async () => {
    try {
      const res = await fetch("/api/nexus/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-visitors" }),
      })
      if (res.ok) {
        showFeedback("success", "Visitor logs cleared")
        fetchData()
      }
    } catch (error) {
      console.error("Failed to clear visitors:", error)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/nexus/auth", { method: "DELETE" })
    onLogout()
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

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "founder":
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
      case "site_manager":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      case "admin":
        return "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
      default:
        return "bg-zinc-600 text-white"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Loading admin panel...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {feedbackMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            feedbackMessage.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      <header className="border-b border-zinc-800 bg-zinc-900/95 sticky top-0 z-40">
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
              <div className="text-right">
                <p className="text-sm font-medium">{user.displayName}</p>
                <Badge className={getRankColor(user.rank)}>{user.rankDisplay}</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:text-white">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-800 border-zinc-700 mb-6 flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="data-[state=active]:bg-zinc-700">
              <Server className="w-4 h-4 mr-2" />
              Endpoints
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              API Logs
            </TabsTrigger>
            <TabsTrigger value="visitors" className="data-[state=active]:bg-zinc-700">
              <Eye className="w-4 h-4 mr-2" />
              Visitors
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-700">
              <History className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-zinc-700">
              <Ban className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            {(user.rank === "founder" || user.rank === "site_manager") && (
              <TabsTrigger value="admins" className="data-[state=active]:bg-zinc-700">
                <Users className="w-4 h-4 mr-2" />
                Admins
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">API Status</CardTitle>
                  <CardDescription className="text-zinc-400">Control the main API availability</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${apiStatus?.enabled ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
                    />
                    <span className={apiStatus?.enabled ? "text-emerald-400" : "text-red-400"}>
                      {apiStatus?.enabled ? "Online" : "Offline"}
                    </span>
                  </div>
                  <Switch checked={apiStatus?.enabled || false} onCheckedChange={toggleApi} disabled={isToggling} />
                </div>
              </CardHeader>
              {apiStatus && (
                <CardContent>
                  <p className="text-sm text-zinc-500">
                    Last toggled by <span className="text-zinc-300">{apiStatus.toggledBy}</span> on{" "}
                    {new Date(apiStatus.lastToggled).toLocaleString()}
                  </p>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats?.totalRequests24h || 0}</p>
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
                      <p className="text-2xl font-bold text-white">{stats?.requestsPerMinute || 0}</p>
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
                      <p className="text-2xl font-bold text-white">{stats?.avgResponseTime || 0}ms</p>
                      <p className="text-xs text-zinc-500">Avg Response</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Eye className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{visitorStats.uniqueVisitors}</p>
                      <p className="text-xs text-zinc-500">Unique Visitors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Usage</CardTitle>
                <CardDescription className="text-zinc-400">Services currently using the API</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  {stats?.platformCounts && Object.entries(stats.platformCounts).length > 0 ? (
                    Object.entries(stats.platformCounts).map(([platform, count]) => (
                      <div key={platform} className="flex items-center gap-3 p-3 bg-zinc-700/50 rounded-lg">
                        {platform === "roblox" ? (
                          <img src="https://www.roblox.com/favicon.ico" alt="Roblox" className="w-6 h-6" />
                        ) : platform === "web" ? (
                          <Globe className="w-6 h-6 text-blue-400" />
                        ) : (
                          <Gamepad2 className="w-6 h-6 text-zinc-400" />
                        )}
                        <div>
                          <p className="font-medium capitalize text-white">{platform}</p>
                          <p className="text-xs text-zinc-500">{count} requests</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">No platform data available yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Endpoint Health</CardTitle>
                <CardDescription className="text-zinc-400">Real-time status of all API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {endpointHealth.map((endpoint) => (
                    <div
                      key={endpoint.endpoint}
                      className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(endpoint.status)}
                        <div>
                          <p className="font-mono text-sm text-white">{endpoint.endpoint}</p>
                          <p className="text-xs text-zinc-500">
                            {endpoint.recentRequests} requests | {endpoint.errorRate}% error rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
                        <p className="text-xs text-zinc-500 mt-1">{endpoint.avgResponseTime}ms avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">API Request Logs</CardTitle>
                  <CardDescription className="text-zinc-400">Recent API requests (last 100)</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="border-zinc-600 bg-transparent text-white hover:bg-zinc-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-zinc-500 text-center py-8">No API logs yet</p>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-3 bg-zinc-700/30 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                log.statusCode < 400
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {log.statusCode}
                            </Badge>
                            <span className="font-mono text-zinc-300">{log.endpoint}</span>
                            <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                              {log.platform}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-zinc-500">
                            <span>{log.responseTime}ms</span>
                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Website Visitors</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {visitorStats.totalVisits} total visits | {visitorStats.uniqueVisitors} unique visitors
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    className="border-zinc-600 bg-transparent text-white hover:bg-zinc-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  {(user.rank === "founder" || user.rank === "site_manager") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearVisitors}
                      className="border-red-600 bg-transparent text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {visitors.length === 0 ? (
                      <p className="text-zinc-500 text-center py-8">No visitor logs yet</p>
                    ) : (
                      visitors.map((visitor) => (
                        <div key={visitor.id} className="p-3 bg-zinc-700/30 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-blue-500/20 text-blue-400">{visitor.method}</Badge>
                              <span className="font-mono text-zinc-300">{visitor.path}</span>
                            </div>
                            <span className="text-zinc-500">{new Date(visitor.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {visitor.ip}
                            </span>
                            {visitor.country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {visitor.city ? `${visitor.city}, ` : ""}
                                {visitor.country}
                              </span>
                            )}
                            {visitor.referer && <span className="truncate max-w-[200px]">From: {visitor.referer}</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Activity Log</CardTitle>
                <CardDescription className="text-zinc-400">
                  All administrative actions performed on this panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {adminLogs.length === 0 ? (
                      <p className="text-zinc-500 text-center py-8">No admin activity yet</p>
                    ) : (
                      adminLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-zinc-700/30 rounded-lg text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-cyan-500/20 text-cyan-400">{log.action}</Badge>
                              <span className="text-zinc-300">by {log.performedBy}</span>
                            </div>
                            <span className="text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-zinc-400">{log.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Block Game</CardTitle>
                <CardDescription className="text-zinc-400">
                  Prevent a specific Roblox game from using the API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="gameId" className="text-zinc-400">
                      Game/Universe ID
                    </Label>
                    <Input
                      id="gameId"
                      value={blockGameId}
                      onChange={(e) => setBlockGameId(e.target.value)}
                      placeholder="Enter game ID"
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="reason" className="text-zinc-400">
                      Reason
                    </Label>
                    <Input
                      id="reason"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Reason for blocking"
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={blockSession} className="bg-red-600 hover:bg-red-700">
                      <Ban className="w-4 h-4 mr-2" />
                      Block
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Blocked Games</CardTitle>
                <CardDescription className="text-zinc-400">Games currently blocked from using the API</CardDescription>
              </CardHeader>
              <CardContent>
                {blockedSessions.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8">No blocked games</p>
                ) : (
                  <div className="space-y-2">
                    {blockedSessions.map((session) => (
                      <div
                        key={session.sessionId}
                        className="flex items-center justify-between p-3 bg-zinc-700/30 rounded-lg"
                      >
                        <div>
                          <p className="font-mono text-white">{session.gameId || session.sessionId}</p>
                          <p className="text-sm text-zinc-500">
                            {session.reason} - Blocked by {session.blockedBy}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => unblockSession(session.sessionId)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {(user.rank === "founder" || user.rank === "site_manager") && (
            <TabsContent value="admins" className="space-y-6">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Add New Admin</CardTitle>
                  <CardDescription className="text-zinc-400">Create a new admin account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="newUsername" className="text-zinc-400">
                        Username
                      </Label>
                      <Input
                        id="newUsername"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        placeholder="Username"
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-zinc-400">
                        Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Password"
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newDisplayName" className="text-zinc-400">
                        Display Name
                      </Label>
                      <Input
                        id="newDisplayName"
                        value={newAdminDisplayName}
                        onChange={(e) => setNewAdminDisplayName(e.target.value)}
                        placeholder="Display name"
                        className="bg-zinc-700 border-zinc-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Rank</Label>
                      <Select value={newAdminRank} onValueChange={setNewAdminRank}>
                        <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="site_manager">Site Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={addAdmin} className="mt-4 bg-cyan-600 hover:bg-cyan-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Admin Accounts</CardTitle>
                  <CardDescription className="text-zinc-400">Manage existing admin accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {admins.map((admin) => (
                      <div
                        key={admin.username}
                        className="flex items-center justify-between p-3 bg-zinc-700/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
                            {admin.displayName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-white">{admin.displayName}</p>
                            <p className="text-xs text-zinc-500">@{admin.username}</p>
                          </div>
                          <Badge className={getRankColor(admin.rank)}>{admin.rankDisplay}</Badge>
                        </div>
                        {admin.rank !== "founder" && user.rank === "founder" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAdmin(admin.username)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
