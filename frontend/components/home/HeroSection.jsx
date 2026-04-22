'use client'

import Link from 'next/link'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[600px] bg-gradient-to-b from-background via-background to-background flex items-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent opacity-20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-36">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance">
            Connect, Learn & Grow in DevOps Engineering
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-balance">
            Join a vibrant community of DevOps engineers. Share knowledge, collaborate on real-world challenges, and advance your skills together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/aauth/signup">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            No credit card required. Join 2000+ DevOps engineers today.
          </p>
        </div>
      </div>
    </section>
  )
}
