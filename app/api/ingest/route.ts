import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: NextRequest) {
  try {
    const { documents } = await req.json()

    if (!documents || !Array.isArray(documents)) {
      return new Response(JSON.stringify({ error: "Valid documents array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const results = []

    for (const doc of documents) {
      // Generate embedding for each document
      const embeddingResponse = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: doc.content }),
      })

      if (!embeddingResponse.ok) {
        throw new Error(`Failed to generate embedding for document: ${doc.id}`)
      }

      const { embedding } = await embeddingResponse.json()

      // Insert document with embedding into Supabase
      const { data, error } = await supabase.from("documents").insert({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata || {},
        embedding,
      })

      if (error) throw error

      results.push({ id: doc.id, status: "success" })
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error ingesting documents:", error)
    return new Response(JSON.stringify({ error: "Failed to ingest documents" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

