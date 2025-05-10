/**
 * Utility functions for interacting with the SEC EDGAR API
 */

// Base URL for SEC EDGAR API
const EDGAR_BASE_URL = "https://www.sec.gov/Archives/edgar"

/**
 * Fetch company filings from the SEC EDGAR database
 * @param cik Company CIK number
 * @param formType Form type (e.g., '10-K', '10-Q')
 * @param limit Maximum number of results to return
 */
export async function fetchCompanyFilings(cik: string, formType?: string, limit = 10) {
  try {
    // Format CIK with leading zeros
    const formattedCik = cik.padStart(10, "0")

    // Construct URL for company submissions
    const url = `https://data.sec.gov/submissions/CIK${formattedCik}.json`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TaxAssistant research.bot@example.com",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch company filings: ${response.statusText}`)
    }

    const data = await response.json()

    // Filter filings by form type if specified
    let filings = data.filings.recent
    if (formType) {
      filings = filings.filter((filing: any) => filing.form === formType)
    }

    // Limit results
    filings = filings.slice(0, limit)

    return filings.map((filing: any) => ({
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      form: filing.form,
      primaryDocument: filing.primaryDocument,
      url:
        `${EDGAR_BASE_URL}/data/${filing.accessionNumber.replace(/-/g, "")}/` +
        `${filing.accessionNumber}/${filing.primaryDocument}`,
    }))
  } catch (error) {
    console.error("Error fetching company filings:", error)
    throw error
  }
}

/**
 * Fetch filing document content
 * @param url URL of the filing document
 */
export async function fetchFilingDocument(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TaxAssistant research.bot@example.com",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch filing document: ${response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    console.error("Error fetching filing document:", error)
    throw error
  }
}

/**
 * Search for companies by name or ticker
 * @param query Search query (company name or ticker)
 */
export async function searchCompanies(query: string) {
  try {
    // This is a simplified example - the actual SEC API for company search is more complex
    // In a real implementation, you would use the SEC's full-text search API
    const url = `https://www.sec.gov/cgi-bin/browse-edgar?company=${encodeURIComponent(query)}&owner=exclude&action=getcompany&output=atom`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TaxAssistant research.bot@example.com",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to search companies: ${response.statusText}`)
    }

    const data = await response.text()

    // Parse XML response (simplified)
    // In a real implementation, you would use an XML parser
    const companies = []
    const matches = data.match(/<title>(.*?)<\/title>/g)

    if (matches) {
      for (const match of matches) {
        const title = match.replace(/<title>|<\/title>/g, "")
        if (title !== "EDGAR Search Results") {
          const [name, cik] = title.split(" CIK#: ")
          if (name && cik) {
            companies.push({
              name: name.trim(),
              cik: cik.trim(),
            })
          }
        }
      }
    }

    return companies
  } catch (error) {
    console.error("Error searching companies:", error)
    throw error
  }
}

