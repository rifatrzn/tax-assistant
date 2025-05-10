"use client"

import { useChat } from "ai/react"
import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function TaxChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div className="flex flex-col h-[calc(100vh-150px)]">
      <Card className="flex-1 overflow-y-auto p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot size={48} className="mb-4" />
            <p className="text-lg font-medium">Ask me anything about taxes and SEC filings</p>
            <p className="text-sm mt-2">I'll use the SEC EDGAR database to provide accurate information</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg",
                  message.role === "user" ? "bg-primary/10 ml-auto max-w-[80%]" : "bg-muted mr-auto max-w-[80%]",
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {message.role === "user" ? (
                    <div className="bg-primary text-primary-foreground p-1 rounded-md">
                      <User className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="bg-muted-foreground text-muted p-1 rounded-md">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {message.reasoning && (
                    <div className="bg-gray-100 p-2 rounded-md mb-2 text-sm text-gray-700 font-mono">
                      <details>
                        <summary className="cursor-pointer">View reasoning</summary>
                        <pre className="whitespace-pre-wrap mt-2">{message.reasoning}</pre>
                      </details>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a tax question..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}

