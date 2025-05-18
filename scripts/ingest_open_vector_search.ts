// scripts/ingest-to-opensearch.ts
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

dotenv.config({ path: '.env.local' });

// Initialize clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2"
});

const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-2"
});

const opensearchClient = new Client({
  ...AwsSigv4Signer({
    region: process.env.AWS_REGION || "us-east-2",
    service: "es",
    getCredentials: () => defaultProvider()()
  }),
  node: process.env.OPENSEARCH_ENDPOINT
});

// Create index if it doesn't exist
async function ensureIndexExists() {
  const indexName = "sec-filings";
  const indexExists = await opensearchClient.indices.exists({ index: indexName });
  
  if (!indexExists.body) {
    await opensearchClient.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            content: { type: "text" },
            embedding: { type: "knn_vector", dimension: 1536 },
            metadata: { type: "object" }
          }
        },
        settings: {
          index: {
            knn: true,
            "knn.space_type": "cosinesimil"
          }
        }
      }
    });
    console.log(`Created index: ${indexName}`);
  }
}

// Generate embeddings using AWS Bedrock
async function generateEmbedding(text: string) {
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v1",
    contentType: "application/json",
    body: JSON.stringify({ inputText: text })
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  return responseBody.embedding;
}

// Process S3 files
async function processS3Files() {
  await ensureIndexExists();
  
  const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
  const PREFIX = process.env.S3_PREFIX || "";
  
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: PREFIX,
    MaxKeys: 10 // Start with a small batch
  });
  
  const { Contents } = await s3Client.send(listCommand);
  
  if (!Contents || Contents.length === 0) {
    console.log("No files found");
    return;
  }
  
  for (const file of Contents) {
    if (!file.Key) continue;
    
    try {
      console.log(`Processing ${file.Key}`);
      
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: file.Key,
      });
      
      const response = await s3Client.send(getCommand);
      const content = await streamToString(response.Body as Readable);
      
      // Extract text based on file type
      const fileExt = file.Key.split('.').pop()?.toLowerCase() || '';
      let text = content;
      
      // Process content based on file type
      if (fileExt === 'json') {
        try {
          const jsonData = JSON.parse(content);
          text = extractTextFromJson(jsonData);
        } catch (e) {
          console.log("Error parsing JSON, using raw content");
        }
      }
      
      // Split into chunks (max 8000 chars for Bedrock)
      const chunks = splitIntoChunks(text, 7500);
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        
        // Store in OpenSearch
        await opensearchClient.index({
          index: "sec-filings",
          id: uuidv4(),
          body: {
            content: chunks[i],
            embedding: embedding,
            metadata: {
              source: file.Key,
              chunk_index: i,
              total_chunks: chunks.length,
              file_type: fileExt
            }
          }
        });
        
        console.log(`Processed chunk ${i+1}/${chunks.length} for ${file.Key}`);
      }
    } catch (error) {
      console.error(`Error processing ${file.Key}:`, error);
    }
  }
}

// Helper functions
function extractTextFromJson(jsonData: any): string {
  if (typeof jsonData === 'string') return jsonData;
  
  if (jsonData.textContent) return jsonData.textContent;
  
  if (jsonData.sections) {
    return jsonData.sections.map((section: any) => 
      `${section.title || ""}\n${section.content || ""}`
    ).join("\n\n");
  }
  
  return JSON.stringify(jsonData);
}

async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLength));
    i += maxLength;
  }
  return chunks;
}

// Run the process
processS3Files().catch(console.error);
