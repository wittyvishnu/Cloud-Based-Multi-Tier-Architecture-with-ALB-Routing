'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { notificationAPI } from '@/lib/api'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function UserHeader() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.log('[v0] Failed to parse user:', error)
      }
    }
    setLoading(false)

    // Fetch unread notifications count
    fetchUnreadCount()
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadNotifications(1)
      const notifications = response.data?.notifications || []
      setUnreadCount(notifications.length)
    } catch (error) {
      console.log('[v0] Failed to fetch unread count:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (loading || !user) {
    return (
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">DC</span>
            </div>
            <Link href="/user/posts" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              DevOpsConnect
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/user/posts" className="text-foreground hover:text-primary transition-colors text-sm">
              Feed
            </Link>
            <Link href="/user/create-post" className="text-foreground hover:text-primary transition-colors text-sm">
              Create Post
            </Link>
            <Link href="/user/profile" className="text-foreground hover:text-primary transition-colors text-sm">
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <Link
              href="/user/notifications"
              className="relative hover:text-primary transition-colors text-foreground"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 hover:bg-primary/10 rounded-full px-3 py-2 transition"
              >
                <Image
                  src={user?.profilePic || BLANK_PROFILE}
                  alt={user?.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-8 h-8"
                  onError={(e) => { e.target.src = BLANK_PROFILE }}
                />
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-12 bg-card border border-border rounded-lg shadow-lg w-48 py-2 z-50">
                  <Link
                    href={`/user/profile`}
                    className="px-4 py-2 text-foreground hover:bg-primary/10 flex items-center gap-2 text-sm transition"
                    onClick={() => setShowMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      handleLogout()
                    }}
                    className="w-full px-4 py-2 text-foreground hover:bg-destructive/10 flex items-center gap-2 text-sm transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
