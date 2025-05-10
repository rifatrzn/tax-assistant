/**
 * Script to ingest SEC EDGAR data into the vector database
 *
 * Run with: npx tsx scripts/ingest-edgar-data.ts
 */

import { fetchCompanyFilings, fetchFilingDocument } from "../lib/edgar-api"
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { v4 as uuidv4 } from "uuid"

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Companies to ingest (example)
const COMPANIES = [
  { name: "Apple Inc.", cik: "0000320193" },
  { name: "Microsoft Corporation", cik: "0000789019" },
  { name: "Amazon.com, Inc.", cik: "0001018724" },
  { name: "Alphabet Inc.", cik: "0001652044" },
  { name: "Meta Platforms, Inc.", cik: "0001326801" },
]

// Form types to ingest
const FORM_TYPES = ["10-K", "10-Q"]

async function generateEmbedding(text: string) {
  try {
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
    return result.data[0].embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    throw error
  }
}

async function processDocument(content: string, metadata: any) {
  // Split document into chunks (simplified)
  const chunkSize = 1000
  const overlap = 200
  const chunks = []

  for (let i = 0; i < content.length; i += chunkSize - overlap) {
    const chunk = content.slice(i, i + chunkSize)
    chunks.push(chunk)
  }

  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]

    try {
      // Generate embedding
      const embedding = await generateEmbedding(chunk)

      // Insert into Supabase
      const { error } = await supabase.from("documents").insert({
        id: uuidv4(),
        content: chunk,
        metadata: {
          ...metadata,
          chunk_index: i,
          total_chunks: chunks.length,
        },
        embedding,
      })

      if (error) throw error

      console.log(`Processed chunk ${i + 1}/${chunks.length} for ${metadata.company_name} ${metadata.form_type}`)
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}/${chunks.length}:`, error)
    }
  }
}

async function main() {
  console.log("Starting SEC EDGAR data ingestion...")

  for (const company of COMPANIES) {
    console.log(`Processing company: ${company.name}`)

    for (const formType of FORM_TYPES) {
      try {
        console.log(`Fetching ${formType} filings for ${company.name}...`)

        // Fetch recent filings
        const filings = await fetchCompanyFilings(company.cik, formType, 2)

        for (const filing of filings) {
          console.log(`Processing filing: ${filing.accessionNumber} (${filing.filingDate})`)

          // Fetch filing document
          const content = await fetchFilingDocument(filing.url)

          // Process document
          await processDocument(content, {
            company_name: company.name,
            company_cik: company.cik,
            form_type: formType,
            filing_date: filing.filingDate,
            accession_number: filing.accessionNumber,
          })

          console.log(`Completed processing filing: ${filing.accessionNumber}`)
        }
      } catch (error) {
        console.error(`Error processing ${formType} filings for ${company.name}:`, error)
      }
    }
  }

  console.log("SEC EDGAR data ingestion completed!")
}

main().catch(console.error)

