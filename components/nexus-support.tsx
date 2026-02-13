"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HallyChat } from "./hally-chat"
import { 
  MessageSquare, 
  Plus, 
  Bot, 
  Ticket, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  ArrowLeft
} from "lucide-react"

interface SupportTicket {
  id: string
  title: string
  description: string
  category: string
  status: string
  priority: string
  createdBy: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  content: string
  author: string
  isStaff: boolean
  createdAt: string
}

export function NexusSupport() {
  const [activeTab, setActiveTab] = useState("hally")
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "other",
    priority: "medium",
    name: "",
  })
  const [replyContent, setReplyContent] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/nexus/support")
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("Failed to fetch tickets:", error)
    }
  }

  const createTicket = async () => {
    if (!newTicket.title || !newTicket.description) return

    setLoading(true)
    try {
      const res = await fetch("/api/nexus/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...newTicket }),
      })
      const data = await res.json()
      if (data.success) {
        setTickets([data.ticket, ...tickets])
        setNewTicket({ title: "", description: "", category: "other", priority: "medium", name: "" })
        setShowNewTicket(false)
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error("Failed to create ticket:", error)
    }
    setLoading(false)
  }

  const sendReply = async () => {
    if (!replyContent.trim() || !selectedTicket) return

    setLoading(true)
    try {
      const res = await fetch("/api/nexus/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reply", 
          ticketId: selectedTicket.id, 
          content: replyContent,
          name: newTicket.name || "Guest"
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, data.message],
        })
        setReplyContent("")
      }
    } catch (error) {
      console.error("Failed to send reply:", error)
    }
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "in-progress": return <Clock className="h-4 w-4 text-blue-500" />
      case "resolved": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default: return <Ticket className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500/10 text-yellow-500"
      case "in-progress": return "bg-blue-500/10 text-blue-500"
      case "resolved": return "bg-green-500/10 text-green-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-500"
      case "high": return "bg-orange-500/10 text-orange-500"
      case "medium": return "bg-blue-500/10 text-blue-500"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-muted-foreground">Get help from Hally AI or create a support ticket</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="hally" className="gap-2">
            <Bot className="h-4 w-4" />
            Hally AI
          </TabsTrigger>
          <TabsTrigger value="tickets" className="gap-2">
            <Ticket className="h-4 w-4" />
            Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hally" className="space-y-4">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-500" />
                Chat with Hally
              </CardTitle>
              <CardDescription>
                Hally can help with code debugging, Nexus Services questions, and general support
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <HallyChat fullScreen />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {selectedTicket ? (
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{selectedTicket.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status}
                      </Badge>
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedTicket.id}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4">
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4">
                      <p className="text-sm font-medium mb-1">{selectedTicket.createdBy}</p>
                      <p className="text-sm">{selectedTicket.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(selectedTicket.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {selectedTicket.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg p-4 ${
                          msg.isStaff ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{msg.author}</p>
                          {msg.isStaff && (
                            <Badge variant="outline" className="text-xs">Staff</Badge>
                          )}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button onClick={sendReply} disabled={loading || !replyContent.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : showNewTicket ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setShowNewTicket(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle>Create Support Ticket</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newTicket.category}
                      onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="api">API Issue</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="bug">Bug Report</SelectItem>
                        <SelectItem value="feature">Feature Request</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    className="min-h-[150px]"
                  />
                </div>

                <Button onClick={createTicket} disabled={loading || !newTicket.title || !newTicket.description} className="w-full">
                  Create Ticket
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-muted-foreground">
                  {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
                </p>
                <Button onClick={() => setShowNewTicket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </div>

              {tickets.length === 0 ? (
                <Card className="p-8">
                  <div className="text-center space-y-2">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="font-medium">No tickets yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Try asking Hally first, or create a support ticket
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(ticket.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{ticket.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {ticket.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(ticket.status)} variant="secondary">
                                {ticket.status}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                                {ticket.priority}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {ticket.messages.length} replies
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
