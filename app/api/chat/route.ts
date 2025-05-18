import { deepseek } from "@ai-sdk/deepseek"
import { streamText } from "ai"
import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create client if both URL and key are available
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1].content

    // Check if Supabase is configured
    if (!supabase) {
      console.error("Supabase client not initialized. Missing environment variables.")
      
      // Fallback to direct response without context
      const result = streamText({
        model: deepseek("deepseek-reasoner"),
        messages: [
          { 
            role: "system", 
            content: "You are a tax expert assistant that specializes in SEC EDGAR filings and tax regulations." 
          }, 
          ...messages
        ],
      })

      return result.toDataStreamResponse({
        sendReasoning: true,
      })
    }

    // Perform vector search in Supabase
    const { data: documents, error } = await performVectorSearch(lastMessage)

    if (error) {
      console.error("Error performing vector search:", error)
      return new Response(JSON.stringify({ error: "Failed to search knowledge base" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Extract relevant context from search results
    const context = documents?.map((doc) => doc.content).join("\n\n") || ""

    // Create system prompt with context
    const systemPrompt = `You are a tax expert assistant that specializes in SEC EDGAR filings and tax regulations.
Use the following information from the SEC EDGAR database to answer the user's question:

${context}

If you don't know the answer or if the information is not in the provided context, say so clearly.
Always provide accurate information and cite specific SEC regulations or filings when possible.
Use <Thinking> tags to show your reasoning process before providing the final answer.`

    // Stream the response using DeepSeek R1
    const result = streamText({
      model: deepseek("deepseek-reasoner"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    })

    return result.toDataStreamResponse({
      sendReasoning: true,
    })
  } catch (error) {
    console.error("Error in chat route:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

async function performVectorSearch(query: string) {
  try {
    if (!supabase) {
      throw new Error("Supabase client not initialized")
    }
    
    // Generate embedding for the query using absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const embeddingResponse = await fetch(`${baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query })
    })

    if (!embeddingResponse.ok) {
      throw new Error("Failed to generate embedding")
    }

    const { embedding } = await embeddingResponse.json()

    // Perform vector search in Supabase
    return await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    })
  } catch (error) {
    console.error("Error in vector search:", error)
    return { data: null, error }
  }
}