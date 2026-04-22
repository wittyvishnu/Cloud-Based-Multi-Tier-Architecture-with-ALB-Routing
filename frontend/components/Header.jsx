'use client'

import Link from 'next/link'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DC</span>
            </div>
            <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              DevOpsConnect
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm">
              Home
            </Link>
            <Link href="#features" className="text-foreground hover:text-primary transition-colors text-sm">
              Features
            </Link>
            <Link href="#how-it-works" className="text-foreground hover:text-primary transition-colors text-sm">
              How It Works
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="auth/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
