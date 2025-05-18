// scripts/ingest-s3-edgar-data.ts

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// S3 bucket configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const PREFIX = process.env.S3_PREFIX || "output/";

async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Embedding API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

async function processJsonDocument(jsonData: any, key: string) {
  try {
    // Extract metadata from the JSON
    const metadata = {
      company_name: jsonData.companyName || "Unknown",
      company_cik: jsonData.cik || "Unknown",
      form_type: jsonData.formType || "Unknown",
      filing_date: jsonData.filingDate || "Unknown",
      accession_number: jsonData.accessionNumber || "Unknown",
      s3_key: key
    };

    // Extract text content from the JSON
    // Adjust this based on your actual JSON structure
    let content = "";
    if (jsonData.textContent) {
      content = jsonData.textContent;
    } else if (jsonData.sections) {
      content = jsonData.sections.map((section: any) => 
        `${section.title || ""}\n${section.content || ""}`
      ).join("\n\n");
    } else {
      content = JSON.stringify(jsonData);
    }

    // Split document into chunks
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunk = content.slice(i, i + chunkSize);
      chunks.push(chunk);
    }

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      const embedding = await generateEmbedding(chunk);

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
      });

      if (error) throw error;

      console.log(`Processed chunk ${i + 1}/${chunks.length} for ${metadata.company_name} ${metadata.form_type}`);
    }
  } catch (error) {
    console.error("Error processing JSON document:", error);
  }
}

async function processS3Object(key: string) {
  try {
    console.log(`Processing S3 object: ${key}`);
    
    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error("Empty response body");
    }
    
    // Convert stream to string
    const jsonString = await streamToString(response.Body as Readable);
    
    // Parse JSON
    const jsonData = JSON.parse(jsonString);
    
    // Process the JSON document
    await processJsonDocument(jsonData, key);
    
    console.log(`Completed processing S3 object: ${key}`);
  } catch (error) {
    console.error(`Error processing S3 object ${key}:`, error);
  }
}

async function main() {
  console.log("Starting S3 EDGAR data ingestion...");
  console.log(`Using S3 bucket: ${BUCKET_NAME}, prefix: ${PREFIX}`);

  try {
    // List objects in the S3 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PREFIX,
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("No objects found in the specified S3 bucket and prefix");
      return;
    }

    console.log(`Found ${listResponse.Contents.length} objects in S3`);

    // Process each JSON file
    for (const object of listResponse.Contents) {
      if (object.Key && object.Key.endsWith('.json')) {
        await processS3Object(object.Key);
      }
    }

    console.log("S3 EDGAR data ingestion completed!");
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

main().catch(console.error);