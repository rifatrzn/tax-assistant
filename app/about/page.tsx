export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">About Tax Assistant</h1>

      <div className="prose max-w-none">
        <p>
          Tax Assistant is an AI-powered application designed to help users find accurate information about tax
          regulations and SEC filings. Our system uses advanced AI technology to provide reliable answers to your
          tax-related questions.
        </p>

        <h2>How It Works</h2>
        <p>Our application combines several technologies to deliver accurate tax information:</p>

        <ul>
          <li>
            <strong>SEC EDGAR Database Integration:</strong> We connect directly to the SEC's Electronic Data Gathering,
            Analysis, and Retrieval (EDGAR) system to access the latest company filings and financial information.
          </li>
          <li>
            <strong>Vector Search Technology:</strong> We use Supabase's vector database capabilities to efficiently
            search through large volumes of tax documents and find the most relevant information for your queries.
          </li>
          <li>
            <strong>Advanced AI Model:</strong> We utilize DeepSeek R1, a state-of-the-art AI model specifically
            designed for complex reasoning tasks, to analyze tax regulations and provide clear, accurate answers.
          </li>
        </ul>

        <h2>Data Sources</h2>
        <p>Our system draws information from:</p>

        <ul>
          <li>SEC EDGAR database (company filings, financial statements, etc.)</li>
          <li>IRS tax regulations and guidelines</li>
          <li>Corporate tax disclosures</li>
          <li>Financial reporting standards</li>
        </ul>

        <h2>Limitations</h2>
        <p>While our system strives to provide accurate information, please note:</p>

        <ul>
          <li>The information provided should not be considered legal or financial advice</li>
          <li>For complex tax situations, please consult with a qualified tax professional</li>
          <li>Our system may not have access to the most recent tax law changes</li>
        </ul>
      </div>
    </div>
  )
}

