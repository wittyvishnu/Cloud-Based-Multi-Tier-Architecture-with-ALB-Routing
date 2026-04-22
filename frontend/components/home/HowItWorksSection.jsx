'use client'

const steps = [
  {
    number: '1',
    title: 'Create Your Account',
    description: 'Sign up in minutes and set up your DevOps profile with your skills and interests.',
  },
  {
    number: '2',
    title: 'Explore the Community',
    description: 'Browse posts, discussions, and resources shared by other DevOps engineers.',
  },
  {
    number: '3',
    title: 'Share & Contribute',
    description: 'Post your insights, solutions, and knowledge with the community.',
  },
  {
    number: '4',
    title: 'Grow Together',
    description: 'Learn from others, get feedback, and advance your DevOps career.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 lg:py-36 bg-card">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Follow these steps to join our thriving community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 text-center">{step.title}</h3>
                <p className="text-muted-foreground text-center text-sm">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[52px] w-[calc(100%+32px)] h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
