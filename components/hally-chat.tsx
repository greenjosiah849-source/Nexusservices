"use client"

import React from "react"

import { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User, Sparkles, Code, HelpCircle, Zap, AlertCircle } from "lucide-react"
import { HALLY_GREETING } from "@/lib/hally-ai"

interface HallyChatProps {
  className?: string
  fullScreen?: boolean
}

export function HallyChat({ className = "", fullScreen = false }: HallyChatProps) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/hally/chat" }), [])

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (err) => {
      console.error("Hally chat error:", err)
      setErrorMsg("Failed to get response. Please try again.")
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    if (error) {
      setErrorMsg("Failed to get response. Please try again.")
    }
  }, [error])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setErrorMsg(null)
    sendMessage({ text: input })
    setInput("")
  }

  const handleQuickPrompt = (prompt: string) => {
    setErrorMsg(null)
    sendMessage({ text: prompt })
  }

  const quickPrompts = [
    { icon: Code, text: "Help with Lua code", prompt: "Can you help me fix a Lua script for Roblox?" },
    { icon: Zap, text: "API endpoints", prompt: "What API endpoints are available in Nexus Services?" },
    { icon: HelpCircle, text: "Common errors", prompt: "What does ZTN ERR CODE 3 mean?" },
  ]

  return (
    <Card className={`flex flex-col ${fullScreen ? "h-[calc(100vh-200px)]" : "h-[500px]"} ${className}`}>
      <CardHeader className="border-b bg-gradient-to-r from-cyan-500/10 to-blue-500/10 py-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="relative">
            <Bot className="h-6 w-6 text-cyan-500" />
            <Sparkles className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1" />
          </div>
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-bold">
            Hally AI
          </span>
          <span className="text-xs text-muted-foreground font-normal">by Nexus Services</span>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-lg bg-muted p-3 max-w-[85%]">
                  <p className="text-sm whitespace-pre-wrap">{HALLY_GREETING}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 ml-11">
                {quickPrompts.map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 bg-transparent"
                    onClick={() => handleQuickPrompt(item.prompt)}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  message.role === "user"
                    ? "bg-primary"
                    : "bg-gradient-to-br from-cyan-500 to-blue-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 max-w-[85%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <div key={index} className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                        {part.text.split("```").map((segment, segIndex) => {
                          if (segIndex % 2 === 1) {
                            const lines = segment.split("\n")
                            const lang = lines[0]
                            const code = lines.slice(1).join("\n")
                            return (
                              <pre key={segIndex} className="bg-background/50 rounded p-2 my-2 overflow-x-auto">
                                <code className={`language-${lang || "plaintext"} text-xs`}>{code}</code>
                              </pre>
                            )
                          }
                          return <span key={segIndex}>{segment}</span>
                        })}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 max-w-[85%]">
                <p className="text-sm text-red-500">{errorMsg}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                  onClick={() => setErrorMsg(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Hally anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  )
}
