"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RobloxAssetCard } from "@/components/roblox-asset-card"
import { Loader2, Search, User, Gamepad2, Shirt, Crown, Globe } from "lucide-react"
import type { RobloxAsset } from "@/lib/roblox-api"

interface ScanResult {
  userId: number
  totalAssets: number
  assets: RobloxAsset[]
  breakdown: {
    universes: number
    gamePasses: number
    clothing: number
    ugc: number
  }
}

export function RobloxAssetScanner() {
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  const handleScan = async () => {
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // First, get the user ID from username
      const userResponse = await fetch(`/api/roblox/user?username=${encodeURIComponent(username)}`)

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || "Failed to find user")
      }

      const user = await userResponse.json()

      // Then fetch all assets
      const assetsResponse = await fetch(`/api/roblox/all-assets?userId=${user.id}`)

      if (!assetsResponse.ok) {
        const errData = await assetsResponse.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to fetch assets")
      }

      const data = await assetsResponse.json()

      // Ensure we have the assets array and breakdown
      setResult({
        userId: data.userId,
        totalAssets: data.totalAssets || 0,
        assets: data.assets || [
          ...(data.universes || []),
          ...(data.gamepasses || []),
          ...(data.clothing || []),
          ...(data.ugc || []),
        ],
        breakdown: data.breakdown || {
          universes: (data.universes || []).length,
          gamePasses: (data.gamepasses || []).length,
          clothing: (data.clothing || []).length,
          ugc: (data.ugc || []).length,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAssets = (type?: string) => {
    if (!result) return []
    if (!type || type === "all") return result.assets
    return result.assets.filter((asset) => asset.type === type)
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Roblox Asset Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter Roblox username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="flex-1"
            />
            <Button onClick={handleScan} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{isLoading ? "Scanning..." : "Scan"}</span>
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{result.totalAssets}</p>
                <p className="text-sm text-muted-foreground">Total Assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Globe className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xl font-bold">{result.breakdown.universes}</p>
                <p className="text-xs text-muted-foreground">Universes/Places</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-xl font-bold">{result.breakdown.gamePasses}</p>
                <p className="text-xs text-muted-foreground">Game Passes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shirt className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xl font-bold">{result.breakdown.clothing}</p>
                <p className="text-xs text-muted-foreground">Clothing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Crown className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xl font-bold">{result.breakdown.ugc}</p>
                <p className="text-xs text-muted-foreground">UGC Items</p>
              </CardContent>
            </Card>
          </div>

          {/* Asset Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({result.totalAssets})</TabsTrigger>
              <TabsTrigger value="Universe">Games ({result.breakdown.universes})</TabsTrigger>
              <TabsTrigger value="GamePass">Passes ({result.breakdown.gamePasses})</TabsTrigger>
              <TabsTrigger value="Clothing">Clothing ({result.breakdown.clothing})</TabsTrigger>
              <TabsTrigger value="UGC">UGC ({result.breakdown.ugc})</TabsTrigger>
            </TabsList>

            {["all", "Universe", "GamePass", "Clothing", "UGC"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-6">
                {filterAssets(tab === "all" ? undefined : tab).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filterAssets(tab === "all" ? undefined : tab).map((asset) => (
                      <RobloxAssetCard key={`${asset.type}-${asset.id}`} asset={asset} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No {tab === "all" ? "assets" : tab.toLowerCase()} found
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
}
