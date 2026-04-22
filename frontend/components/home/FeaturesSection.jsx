'use client'

import { Users, Zap, BookOpen, Network } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Community First',
    description: 'Connect with 2000+ DevOps engineers and build meaningful relationships.',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Sharing',
    description: 'Access curated articles, tutorials, and best practices from industry experts.',
  },
  {
    icon: Zap,
    title: 'Real-world Solutions',
    description: 'Solve actual DevOps challenges with guidance from experienced professionals.',
  },
  {
    icon: Network,
    title: 'Network & Collaborate',
    description: 'Find collaboration opportunities and grow your professional network.',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 lg:py-36 bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Why Choose DevOpsConnect?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to advance your DevOps career and build stronger systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary transition-all hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
