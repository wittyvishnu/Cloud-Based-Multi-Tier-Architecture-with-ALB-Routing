'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import PostCard from '@/components/post/PostCard'
import { postAPI } from '@/lib/api'
import { Plus } from 'lucide-react'

export default function PostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState(() => {
    return searchParams.get('tab') || 'for-you'
  })
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setCurrentUserId(user.id)
    }
  }, [])

  useEffect(() => {
    if (currentUserId) {
      fetchPosts()
    }
  }, [tab, currentPage, currentUserId])

  const fetchPosts = async () => {
    if (!currentUserId) return
    
    setLoading(true)
    try {
      let response
      
      if (tab === 'for-you') {
        response = await postAPI.getForYouPosts(currentPage)
      } else if (tab === 'following') {
        response = await postAPI.getFollowingPosts(currentPage)
      }

      const postsData = response.data.posts || response.data.data || []
      console.log('[v0] Loaded posts:', postsData.length, 'from tab:', tab)
      
      if (currentPage === 1) {
        setPosts(postsData)
      } else {
        setPosts(prev => [...prev, ...postsData])
      }
      
      // Check if there are more posts to load
      setHasMore(postsData.length > 0)
    } catch (error) {
      console.log('[v0] Error loading posts:', error.message, 'Tab:', tab, 'Page:', currentPage)
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setCurrentPage(1)
    setPosts([])
    // Update URL with tab parameter
    router.push(`/user/posts?tab=${newTab}`)
  }

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const loadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-background/80 backdrop-blur z-10">
        <div className="flex">
          <button
            onClick={() => handleTabChange('for-you')}
            className={`flex-1 px-4 py-4 font-bold text-center transition border-b-2 ${
              tab === 'for-you'
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:bg-card/50'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => handleTabChange('following')}
            className={`flex-1 px-4 py-4 font-bold text-center transition border-b-2 ${
              tab === 'following'
                ? 'text-foreground border-primary'
                : 'text-muted-foreground border-transparent hover:bg-card/50'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Posts */}
      <div>
        {posts.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">No posts yet</p>
            <p className="text-muted-foreground">
              {tab === 'for-you' ? 'Check back later for new posts' : 'Follow users to see their posts'}
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
                currentUserId={currentUserId}
              />
            ))}

            {loading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!loading && hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={loadMore}
                  className="px-6 py-2 rounded-full border border-border hover:bg-card transition font-semibold text-foreground"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Create Post Button */}
      <Link
        href="/user/create-post"
        className="fixed bottom-8 right-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
        title="Create new post"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
