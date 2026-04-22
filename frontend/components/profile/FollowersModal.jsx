'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { userAPI } from '@/lib/api'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function FollowersModal({ userId, onClose }) {
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        setLoading(true)
        const response = await userAPI.getFollowers(userId, currentPage)
        setFollowers(response.data.users)
        setTotalPages(response.data.totalPages)
      } catch (error) {
        console.error('[v0] Failed to fetch followers:', error)
        toast.error('Failed to load followers')
      } finally {
        setLoading(false)
      }
    }

    fetchFollowers()
  }, [userId, currentPage])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card/95">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Followers</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : followers.length > 0 ? (
            <div className="divide-y divide-border">
              {followers.map((follower) => (
                <Link
                  key={follower.id}
                  href={`/user/profile/${follower.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-4 sm:p-5 hover:bg-muted/50 transition-colors"
                >
                  <Image
                    src={follower.profilePic || BLANK_PROFILE}
                    alt={follower.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover border-2 border-primary"
                    onError={(e) => {
                      e.target.src = BLANK_PROFILE
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate text-base sm:text-lg">
                      {follower.name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p className="text-base">No followers yet</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-t border-border bg-card/95">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 hover:bg-muted disabled:opacity-50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-muted disabled:opacity-50 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
