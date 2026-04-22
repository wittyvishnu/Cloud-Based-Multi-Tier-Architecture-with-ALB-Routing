'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { userAPI } from '@/lib/api'
import { X, ChevronLeft, ChevronRight, UserCheck, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function FollowingModal({ userId, onClose }) {
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [followingStates, setFollowingStates] = useState({})
  const [toggleLoading, setToggleLoading] = useState({})

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        setLoading(true)
        const response = await userAPI.getFollowing(userId, currentPage)
        setFollowing(response.data.users)
        setTotalPages(response.data.totalPages)

        // Initialize following states
        const states = {}
        response.data.users.forEach(user => {
          states[user.id] = true // They're in following list, so we're following them
        })
        setFollowingStates(states)
      } catch (error) {
        console.error('[v0] Failed to fetch following:', error)
        toast.error('Failed to load following list')
      } finally {
        setLoading(false)
      }
    }

    fetchFollowing()
  }, [userId, currentPage])

  const handleToggleFollow = async (followingUserId, e) => {
    e.preventDefault()
    e.stopPropagation()

    setToggleLoading(prev => ({ ...prev, [followingUserId]: true }))
    try {
      await userAPI.toggleFollow(followingUserId)
      setFollowingStates(prev => ({
        ...prev,
        [followingUserId]: !prev[followingUserId]
      }))
      toast.success('Updated!')
    } catch (error) {
      console.error('[v0] Failed to toggle follow:', error)
      toast.error('Failed to update')
    } finally {
      setToggleLoading(prev => ({ ...prev, [followingUserId]: false }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border sticky top-0 bg-card/95">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Following</h2>
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
          ) : following.length > 0 ? (
            <div className="divide-y divide-border">
              {following.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-4 sm:p-5 hover:bg-muted/50 transition-colors group"
                >
                  <Link
                    href={`/user/profile/${user.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Image
                      src={user.profilePic || BLANK_PROFILE}
                      alt={user.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover border-2 border-primary"
                      onError={(e) => {
                        e.target.src = BLANK_PROFILE
                      }}
                    />
                    <p className="font-semibold text-foreground truncate text-base sm:text-lg group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                  </Link>
                  <Button
                    onClick={(e) => handleToggleFollow(user.id, e)}
                    disabled={toggleLoading[user.id]}
                    className="py-2 px-4 text-sm font-semibold bg-muted text-foreground hover:bg-muted/80"
                    variant="outline"
                  >
                    {toggleLoading[user.id] ? (
                      'Loading...'
                    ) : followingStates[user.id] ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-1" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p className="text-base">Not following anyone yet</p>
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
