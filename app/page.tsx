import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">Tax Assistant</h1>
          <p className="mt-6 text-lg text-gray-500">
            Get answers to your tax questions using SEC EDGAR data and advanced AI
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/chat">
              <Button className="px-6 py-5 text-lg">
                Start Chatting <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" className="px-6 py-5 text-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

