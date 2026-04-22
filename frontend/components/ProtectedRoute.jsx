'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { authAPI } from '@/lib/api'

export default function ProtectedRoute({ children }) {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          router.push('/auth/login')
          return
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.data?.valid) {
          setIsVerified(true)
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('[v0] Token verification failed:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-foreground">Verifying credentials...</p>
        </div>
      </div>
    )
  }

  return isVerified ? children : null
}
