'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Copy } from 'lucide-react'
import { postAPI } from '@/lib/api'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function PostCard({ post, onPostDeleted, currentUserId }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post?.isLiked || false)
  const [likeCount, setLikeCount] = useState(post?.likesCount || post?.totalLikes || 0)
  const [showMenu, setShowMenu] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Handle undefined post after hooks
  if (!post) {
    return null
  }

  const isOwner = currentUserId === post.userId

  const handleLike = async () => {
    try {
      const response = await postAPI.toggleLike(post?.id)
      setIsLiked(response.data.isLiked)
      setLikeCount(prev => response.data.isLiked ? prev + 1 : prev - 1)
    } catch (error) {
      console.log('[v0] Like error:', error.message)
      toast.error('Failed to like post')
    }
  }

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/user/posts/${post.id}`
    }
    return ''
  }

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl()
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied!')
      setShowShareMenu(false)
    } catch (error) {
      console.log('[v0] Copy error:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleShareVia = async (platform) => {
    const shareUrl = getShareUrl()
    const text = `Check out this post: `
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
      default:
        return
    }

    window.open(url, '_blank', 'width=600,height=400')
    setShowShareMenu(false)
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
  }

  const handleEdit = () => {
    setShowMenu(false)
    router.push(`/user/posts/${post?.id}/edit`)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    
    setIsDeleting(true)
    try {
      await postAPI.deletePost(post?.id)
      toast.success('Post deleted')
      setShowMenu(false)
      onPostDeleted?.(post?.id)
    } catch (error) {
      console.log('[v0] Delete error:', error.message)
      toast.error('Failed to delete post')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (date) => {
    const now = new Date()
    const postDate = new Date(date)
    const diff = now - postDate
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return postDate.toLocaleDateString()
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        <Link href={`/user/profile/${post?.userId}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition">
          <Image
            src={post?.author?.profilePic || BLANK_PROFILE}
            alt={post?.author?.name || 'User'}
            width={40}
            height={40}
            className="rounded-full object-cover w-10 h-10"
            onError={(e) => { e.target.src = BLANK_PROFILE }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-foreground truncate hover:underline">
              {post?.author?.name || 'Unknown'}
            </h3>
            <p className="text-xs text-muted-foreground">{formatDate(post?.createdAt)}</p>
          </div>
        </Link>

        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="hover:bg-primary/10 rounded-full p-2 transition ml-2"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg z-10">
                <button
                  onClick={handleEdit}
                  disabled={isUpdating}
                  className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 rounded-t-lg flex items-center gap-2 text-sm border-b border-border/50"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-destructive/10 rounded-b-lg flex items-center gap-2 text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post?.text && (
        <div className="px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {post.text}
          </p>
        </div>
      )}

      {/* Images Grid - Instagram Style */}
      {post?.imageUrls && post.imageUrls.length > 0 && (
        <div className={`grid gap-1 bg-muted ${
          post.imageUrls.length === 1 ? 'grid-cols-1' :
          post.imageUrls.length === 2 ? 'grid-cols-2' :
          post.imageUrls.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {post.imageUrls.map((img, idx) => (
            <div
              key={idx}
              className="relative bg-muted overflow-hidden"
              style={{ 
                aspectRatio: '1/1',
                gridColumn: post?.imageUrls?.length === 3 && idx === 2 ? 'span 1' : 'auto',
              }}
            >
              <Image
                src={img}
                alt={`Post image ${idx + 1}`}
                fill
                className="object-cover hover:opacity-90 transition-opacity"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          ))}
        </div>
      )}

    

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border/50 flex items-center justify-around text-muted-foreground relative">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 hover:text-primary transition py-2"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          {likeCount > 0 && <span className="text-sm">{likeCount.toLocaleString()}</span>}
        </button>

        <Link
          href={`/user/posts/${post?.id}`}
          className="flex items-center gap-2 hover:text-primary transition py-2"
        >
          <MessageCircle className="w-5 h-5" />
          {post?.commentsCount > 0 && <span className="text-sm">{post.commentsCount}</span>}
        </Link>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 hover:text-primary transition py-2 relative"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Share Menu */}
        {showShareMenu && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg z-20 min-w-max">
            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 rounded-t-lg flex items-center gap-2 text-sm border-b border-border/50"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => handleShareVia('twitter')}
              className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 flex items-center gap-2 text-sm border-b border-border/50"
            >
              𝕏 Twitter
            </button>
            <button
              onClick={() => handleShareVia('facebook')}
              className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 flex items-center gap-2 text-sm border-b border-border/50"
            >
              f Facebook
            </button>
            <button
              onClick={() => handleShareVia('whatsapp')}
              className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 flex items-center gap-2 text-sm border-b border-border/50"
            >
              💬 WhatsApp
            </button>
            <button
              onClick={() => handleShareVia('linkedin')}
              className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 rounded-b-lg flex items-center gap-2 text-sm"
            >
              in LinkedIn
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
