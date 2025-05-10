# Tax Assistant

A Next.js application that provides tax assistance through a chat interface. This application uses Supabase for backend services and integrates with the EDGAR API for financial data.

## Features

- Interactive chat interface for tax-related questions
- Integration with EDGAR API for financial data
- Responsive UI built with modern components

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, or pnpm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/rifatrzn/taxapp-project.git
   cd taxapp-project
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `/app` - Next.js app directory with pages and API routes
- `/components` - Reusable UI components
- `/lib` - Utility functions and API clients
- `/public` - Static assets
- `/scripts` - Data ingestion scripts
- `/styles` - Global styles
- `/supabase` - Supabase migrations and configurations

## License

[MIT](LICENSE)