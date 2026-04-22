'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProfileView from '@/components/profile/ProfileView'

export default function OtherUserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Get the profile ID from URL
    if (params?.id) {
      setUserId(params.id)
    }

    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user'))
    if (user?.id) {
      setCurrentUserId(user.id)
    }
  }, [params])

  // Redirect to /user/profile if viewing own profile
  useEffect(() => {
    if (userId && currentUserId && userId === currentUserId) {
      setIsRedirecting(true)
      router.push('/user/profile')
    }
  }, [userId, currentUserId, router])

  if (!userId || !currentUserId || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If viewing other user's profile
  const isOwnProfile = false

  return <ProfileView userId={userId} isOwnProfile={isOwnProfile} />
}
