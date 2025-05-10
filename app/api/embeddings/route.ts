import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Call embedding model API (using OpenAI's embedding model as an example)
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Embedding API error: ${JSON.stringify(error)}`)
    }

    const result = await response.json()
    const embedding = result.data[0].embedding

    return new Response(JSON.stringify({ embedding }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error generating embedding:", error)
    return new Response(JSON.stringify({ error: "Failed to generate embedding" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

