import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

// Initialize the fonts
const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata = {
  title: 'DevOpsConnect - Connect & Share DevOps Knowledge',
  description: 'Join 2000+ DevOps engineers. Connect, learn, and grow together in a thriving community.',
  generator: 'v0.app',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Add the font variables to the body class */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
