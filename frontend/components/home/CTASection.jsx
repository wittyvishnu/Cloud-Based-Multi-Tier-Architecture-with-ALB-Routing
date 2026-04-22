'use client'

import Link from 'next/link'
import { Button } from '../ui/button'

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-gradient-to-b from-background to-card">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
          Ready to join the community?
        </h2>

        <p className="text-lg text-muted-foreground mb-8 text-balance">
          Start your journey with DevOpsConnect today. Connect with engineers worldwide, share your expertise, and grow together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/signup">Get Started for Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">I Already Have an Account</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Join thousands of DevOps professionals. No credit card required.
        </p>
      </div>
    </section>
  )
}
