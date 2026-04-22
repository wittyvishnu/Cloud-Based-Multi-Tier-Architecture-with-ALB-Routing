'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import PostCard from '@/components/post/PostCard'
import { postAPI } from '@/lib/api'

export default function ProfilePosts({ userId, currentUserId }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const observerTarget = useRef(null)

  useEffect(() => {
    fetchPosts(1)
  }, [userId])

  const fetchPosts = useCallback(async (page) => {
    setLoading(true)
    try {
      const response = await postAPI.getUserPosts(userId, page)
      if (page === 1) {
        setPosts(response.data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(response.data.posts || [])])
      }
      setTotalPages(response.data?.count || 1)
      setCurrentPage(page)
    } catch (error) {
      console.log('[v0] Failed to load posts:', error)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!observerTarget.current || currentPage >= totalPages || loading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentPage < totalPages && !loading) {
          fetchPosts(currentPage + 1)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [totalPages, loading, currentPage, fetchPosts])

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* List of posts */}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onPostDeleted={handlePostDeleted}
          currentUserId={currentUserId}
        />
      ))}

      {/* Infinite scroll trigger */}
      {currentPage < totalPages && (
        <div ref={observerTarget} className="py-8">
          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
