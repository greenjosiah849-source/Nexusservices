import { RobloxAssetScanner } from "@/components/roblox-asset-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Shield, BarChart3, Zap, Bot, HelpCircle, Code, ExternalLink } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Nexus branding and nav */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Nexus Services</h1>
                <p className="text-xs text-zinc-500">by Zauataun (Zap | ZAZEM)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/support">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Bot className="w-4 h-4 mr-2" />
                  Support
                </Button>
              </Link>
              <Link href="/stats">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-transparent">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-4">
              <Zap className="w-3 h-3" />
              <span>Roblox API Service</span>
            </div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Nexus Services API
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Powerful API for fetching Roblox user assets including gamepasses, clothing, UGC items, and universes
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/support">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-cyan-500/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                    <Bot className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Hally AI</h3>
                    <p className="text-xs text-zinc-500">Get help with code and API</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/stats">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-green-500/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-colors">
                    <BarChart3 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">API Stats</h3>
                    <p className="text-xs text-zinc-500">Real-time analytics</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Code className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">API Docs</h3>
                  <p className="text-xs text-zinc-500">Integration guide below</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scanner */}
          <RobloxAssetScanner />

          {/* API Documentation */}
          <Card className="mt-8 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                API Endpoints
              </CardTitle>
              <CardDescription>Available endpoints for your Roblox games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                {[
                  { method: "GET", path: "/api/roblox/user?username={username}", desc: "Get user info" },
                  { method: "GET", path: "/api/roblox/gamepasses?userId={userId}", desc: "Get gamepasses" },
                  { method: "GET", path: "/api/roblox/clothing?userId={userId}", desc: "Get clothing" },
                  { method: "GET", path: "/api/roblox/ugc?userId={userId}", desc: "Get UGC items" },
                  { method: "GET", path: "/api/roblox/all-assets?userId={userId}", desc: "Get all assets" },
                ].map((endpoint, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400">
                      {endpoint.method}
                    </span>
                    <code className="flex-1 text-zinc-300">{endpoint.path}</code>
                    <span className="text-xs text-zinc-500">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-zinc-600">
            Nexus Services by Zauataun (Zap | ZAZEM)
          </p>
        </div>
      </footer>
    </main>
  )
}
