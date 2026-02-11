import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { RobloxAsset } from "@/lib/roblox-api"

interface RobloxAssetCardProps {
  asset: RobloxAsset
}

const typeColors: Record<string, string> = {
  GamePass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Clothing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  UGC: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Universe: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  Place: "bg-pink-500/10 text-pink-500 border-pink-500/20",
}

export function RobloxAssetCard({ asset }: RobloxAssetCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]">
      <div className="aspect-square relative bg-muted">
        {asset.imageUrl ? (
          <Image
            src={asset.imageUrl || "/placeholder.svg"}
            alt={asset.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm line-clamp-2">{asset.name}</h3>
          <Badge variant="outline" className={`shrink-0 text-xs ${typeColors[asset.type]}`}>
            {asset.type}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>ID: {asset.id}</span>
          {asset.price !== null && asset.price !== undefined && (
            <span className="font-medium text-foreground">
              {asset.price === 0 ? "Free" : `R$ ${asset.price.toLocaleString()}`}
            </span>
          )}
        </div>
        {asset.universeId && <p className="text-xs text-muted-foreground mt-1">Universe: {asset.universeId}</p>}
      </CardContent>
    </Card>
  )
}
