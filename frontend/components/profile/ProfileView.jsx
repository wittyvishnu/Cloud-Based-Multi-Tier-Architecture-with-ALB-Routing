'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { authAPI, userAPI } from '@/lib/api'
import { Users, UserCheck, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import FollowersModal from './FollowersModal'
import FollowingModal from './FollowingModal'
import ProfilePosts from './ProfilePosts'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function ProfileView({ userId, isOwnProfile }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setCurrentUserId(user.id)

    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile(userId)
        setProfile(response.data.user)

        if (!isOwnProfile) {
          const statusResponse = await userAPI.getFollowStatus(userId)
          setIsFollowing(statusResponse.data.isFollowing)
        }
      } catch (error) {
        console.error('[v0] Failed to fetch profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId, isOwnProfile])

  const handleToggleFollow = async () => {
    setFollowLoading(true)
    try {
      await userAPI.toggleFollow(userId)
      const newFollowingState = !isFollowing
      setIsFollowing(newFollowingState)
      
      // Update profile follower count
      setProfile(prev => ({
        ...prev,
        followers: prev.followers + (newFollowingState ? 1 : -1)
      }))
      
      toast.success(newFollowingState ? 'Following!' : 'Unfollowed')
    } catch (error) {
      console.error('[v0] Failed to toggle follow:', error)
      toast.error('Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground text-lg">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <Image
                src={profile.profilePic || BLANK_PROFILE}
                alt={profile.name}
                width={160}
                height={160}
                priority
                className="rounded-full object-cover border-4 border-primary shadow-lg"
                onError={(e) => {
                  e.target.src = BLANK_PROFILE
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                    {profile.name}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground">{profile.email}</p>
                </div>

                {!isOwnProfile && (
                  <Button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`w-full sm:w-auto py-3 px-6 text-base font-semibold rounded-lg transition-all ${
                      isFollowing
                        ? 'bg-muted text-foreground border border-border hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    variant={isFollowing ? 'outline' : 'default'}
                  >
                    {followLoading ? (
                      'Loading...'
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-5 h-5 mr-2 inline" />
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="w-5 h-5 mr-2 inline" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>

              {profile.bio && (
                <p className="text-base text-foreground mb-6 leading-relaxed">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8">
                <button className="text-center hover:opacity-80 transition-opacity">
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {profile.totalPostsCount}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">Posts</p>
                </button>

                <button
                  onClick={() => setShowFollowers(true)}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {profile.followers}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">Followers</p>
                </button>

                <button
                  onClick={() => setShowFollowing(true)}
                  className="text-center hover:opacity-80 transition-opacity"
                >
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {profile.following}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mt-1">Following</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-primary/10 text-primary px-4 sm:px-5 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Posts Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5">Posts</h2>
          <ProfilePosts userId={userId} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Modals */}
      {showFollowers && (
        <FollowersModal
          userId={userId}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <FollowingModal
          userId={userId}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  )
}
