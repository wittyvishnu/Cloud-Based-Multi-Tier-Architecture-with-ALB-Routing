'use client'

import { useEffect, useState } from 'react'
import EditableProfile from '@/components/profile/EditableProfile'

export default function ProfilePage() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user?.id) {
      setUserId(user.id)
    }
  }, [])

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <EditableProfile userId={userId} />
}
