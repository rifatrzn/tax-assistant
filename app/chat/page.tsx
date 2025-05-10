import { TaxChatInterface } from "@/components/tax-chat-interface"

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Tax Assistant Chat</h1>
        <TaxChatInterface />
      </main>
    </div>
  )
}

