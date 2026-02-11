import { NexusSupport } from "@/components/nexus-support"
import Link from "next/link"
import { ArrowLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Support | Nexus Services",
  description: "Get help from Hally AI or create a support ticket",
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">Nexus Services</h1>
                <p className="text-xs text-zinc-500">by Zauataun (Zap | ZAZEM)</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/stats">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Stats
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <NexusSupport />
      </main>

      <footer className="border-t border-zinc-800 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-600">
          Nexus Services by Zauataun (Zap | ZAZEM)
        </div>
      </footer>
    </div>
  )
}
