import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { HALLY_SYSTEM_PROMPT, getTopicFromMessage, detectLanguage } from "@/lib/hally-ai"

export const maxDuration = 60

function getMessageText(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages: UIMessage[] = body.messages || []

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const lastMessage = messages[messages.length - 1]
    const messageText = getMessageText(lastMessage)

    const topic = getTopicFromMessage(messageText)
    const language = detectLanguage(messageText)

    let enhancedPrompt = HALLY_SYSTEM_PROMPT

    if (topic === "code" && language !== "other") {
      enhancedPrompt += `\n\n## Current Context\nThe user is asking about ${language} code. Provide ${language}-specific solutions and best practices. Always include working code examples.`
    }

    if (topic === "nexus") {
      enhancedPrompt += `\n\n## Current Context\nThe user is asking about Nexus Services. Focus on API usage, endpoints, and integration help. Include example code when relevant.`
    }

    const convertedMessages = await convertToModelMessages(messages)

    const result = streamText({
      model: "openai/gpt-4o-mini",
      system: enhancedPrompt,
      messages: convertedMessages,
      maxOutputTokens: 4000,
      temperature: 0.7,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("Hally AI error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to process request", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
