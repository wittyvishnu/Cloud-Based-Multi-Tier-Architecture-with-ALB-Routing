'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Heart, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react'
import { postAPI, commentAPI } from '@/lib/api'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [showMenu, setShowMenu] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [commentLikes, setCommentLikes] = useState({})
  const [expandedComments, setExpandedComments] = useState({})
  const [nestedComments, setNestedComments] = useState({})
  const [loadingReplies, setLoadingReplies] = useState({})
  const [replyImages, setReplyImages] = useState({})
  const [replyImagePreviews, setReplyImagePreviews] = useState({})
  const [commentImages, setCommentImages] = useState([])
  const [commentImagePreviews, setCommentImagePreviews] = useState([])
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'))
    if (user) {
      setCurrentUserId(user.id)
    }
  }, [])

  useEffect(() => {
    if (params.id && currentUserId) {
      fetchPostAndComments()
    }
  }, [params.id, currentUserId])

  const fetchPostAndComments = async () => {
    setLoading(true)
    try {
      const [postRes, commentsRes] = await Promise.all([
        postAPI.getPostById(params.id),
        commentAPI.getPostComments(params.id),
      ])

      const postData = postRes.data.post || postRes.data
      setPost(postData)
      setIsLiked(postData.isLiked || false)
      setLikeCount(postData.likesCount || postData.totalLikes || 0)
      setComments(commentsRes.data.comments || commentsRes.data || [])
    } catch (error) {
      console.log('[v0] Error loading post:', error.message)
      toast.error('Failed to load post')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await postAPI.toggleLike(post.id)
      setIsLiked(response.data.isLiked)
      setLikeCount(prev => response.data.isLiked ? prev + 1 : prev - 1)
    } catch (error) {
      toast.error('Failed to like post')
    }
  }

  const handleCommentImageSelect = (event) => {
    const files = Array.from(event.target.files || [])
    const maxImages = 4
    
    if (commentImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const newFiles = files.slice(0, maxImages - commentImages.length)
    setCommentImages(prev => [...prev, ...newFiles])

    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCommentImagePreviews(prev => [...prev, e.target?.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeCommentImage = (index) => {
    setCommentImages(prev => prev.filter((_, i) => i !== index))
    setCommentImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() && commentImages.length === 0) return

    try {
      const response = await commentAPI.createComment({
        postId: post.id,
        comment: newComment.trim(),
        images: commentImages
      })
      setComments(prev => [response.data || response.data.comment, ...prev])
      setNewComment('')
      setCommentImages([])
      setCommentImagePreviews([])
      toast.success('Comment added')
    } catch (error) {
      toast.error('Failed to add comment')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return

    try {
      await postAPI.deletePost(post.id)
      toast.success('Post deleted')
      router.push('/user/posts?tab=for-you')
    } catch (error) {
      toast.error('Failed to delete post')
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
      toast.success('Link copied to clipboard!')
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

  const handleShare = async () => {
    const shareUrl = getShareUrl()
    
    // Try native share API first (for mobile)
    if (navigator.share && !showShareMenu) {
      try {
        await navigator.share({
          title: 'Check out this post',
          url: shareUrl,
        })
        setShowShareMenu(false)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('[v0] Share error:', error)
        }
      }
    } else {
      // Show menu on desktop or if native share failed
      setShowShareMenu(!showShareMenu)
    }
  }

  const handleReplyImageSelect = (commentId, event) => {
    const files = Array.from(event.target.files || [])
    const maxImages = 4
    const currentImages = replyImages[commentId] || []
    
    if (currentImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const newFiles = files.slice(0, maxImages - currentImages.length)
    setReplyImages(prev => ({
      ...prev,
      [commentId]: [...(prev[commentId] || []), ...newFiles]
    }))

    const currentPreviews = replyImagePreviews[commentId] || []
    const newPreviews = [...currentPreviews]

    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newPreviews.push(e.target?.result)
        setReplyImagePreviews(prev => ({
          ...prev,
          [commentId]: newPreviews
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeReplyImage = (commentId, index) => {
    setReplyImages(prev => ({
      ...prev,
      [commentId]: prev[commentId]?.filter((_, i) => i !== index) || []
    }))
    setReplyImagePreviews(prev => ({
      ...prev,
      [commentId]: prev[commentId]?.filter((_, i) => i !== index) || []
    }))
  }

  const handleReplyComment = async (e, commentId) => {
    e.preventDefault()
    const commentImages = replyImages[commentId] || []
    if (!replyText.trim() && commentImages.length === 0) return

    try {
      const response = await commentAPI.createComment({
        commentId: commentId,
        comment: replyText.trim(),
        images: commentImages
      })

      // Update the parent comment's reply count
      setComments(prev => 
        prev.map(c => 
          c.id === commentId 
            ? { ...c, totalReplies: (c.totalReplies || 0) + 1 }
            : c
        )
      )

      // Add the new reply to nested comments
      const newReply = response.data || response.data.comment
      setNestedComments(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply]
      }))

      setReplyText('')
      setReplyingTo(null)
      setReplyImages(prev => ({
        ...prev,
        [commentId]: []
      }))
      setReplyImagePreviews(prev => ({
        ...prev,
        [commentId]: []
      }))
      toast.success('Reply added')
    } catch (error) {
      console.log('[v0] Error adding reply:', error.message)
      toast.error('Failed to add reply')
    }
  }

  const handleCommentLike = async (commentId) => {
    try {
      const response = await commentAPI.toggleLike(commentId)
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: response.data.isLiked
      }))
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { 
                ...c, 
                totalLikes: response.data.isLiked ? (c.totalLikes || 0) + 1 : Math.max(0, (c.totalLikes || 0) - 1),
                isLiked: response.data.isLiked
              }
            : c
        )
      )
    } catch (error) {
      toast.error('Failed to like comment')
    }
  }

  const fetchNestedComments = async (commentId) => {
    if (nestedComments[commentId]) {
      setExpandedComments(prev => ({
        ...prev,
        [commentId]: !prev[commentId]
      }))
      return
    }

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }))
    try {
      const response = await commentAPI.getCommentReplies(commentId)
      const replies = response.data.comments || []
      setNestedComments(prev => ({
        ...prev,
        [commentId]: replies
      }))
      setExpandedComments(prev => ({
        ...prev,
        [commentId]: true
      }))
    } catch (error) {
      console.log('[v0] Error loading replies:', error.message)
      toast.error('Failed to load replies')
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }))
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
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return postDate.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Post not found</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const isOwner = currentUserId === post.userId

  return (
    <div className="max-w-2xl mx-auto border-l border-r border-border">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border z-10 p-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="hover:bg-primary/10 rounded-full p-2 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Post</h1>
      </div>

      {/* Post */}
      <div className="border-b border-border">
        {/* Post Header */}
        <div className="p-4 flex items-start justify-between">
          <Link href={`/user/profile/${post.userId}`} className="flex gap-3 flex-1">
            <Image
              src={post.author?.profilePic || BLANK_PROFILE}
              alt={post.author?.name || 'User'}
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
              onError={(e) => { e.target.src = BLANK_PROFILE }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-foreground">{post.author?.name || 'Unknown'}</h2>
              </div>
              <p className="text-muted-foreground text-sm">{formatDate(post.createdAt)}</p>
            </div>
          </Link>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="hover:bg-primary/10 rounded-full p-2 transition"
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-red-500 hover:bg-destructive/10 rounded-lg flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-3">
          <p className="text-base text-foreground whitespace-pre-wrap">{post.text}</p>
        </div>

        {/* Post Images */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className={`grid gap-1 bg-muted mb-3 ${
            post.imageUrls.length === 1 ? 'grid-cols-1' :
            post.imageUrls.length === 2 ? 'grid-cols-2' :
            post.imageUrls.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {post.imageUrls.map((img, idx) => (
              <div
                key={idx}
                className="relative bg-muted overflow-hidden"
                style={{ aspectRatio: '1/1' }}
              >
                <Image
                  src={img}
                  alt={`Post image ${idx + 1}`}
                  fill
                  className="object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-3 border-t border-border/50 text-sm text-muted-foreground flex gap-6">
          <button className="hover:text-foreground transition">
            <span className="font-semibold text-foreground">{likeCount.toLocaleString()}</span> <span className="text-muted-foreground">Likes</span>
          </button>
          <button className="hover:text-foreground transition">
            <span className="font-semibold text-foreground">{comments.length}</span> <span className="text-muted-foreground">Comments</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-border/50 flex justify-around text-muted-foreground relative">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 py-2 hover:text-primary transition"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
          <button className="flex items-center gap-2 py-2 hover:text-primary transition">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 py-2 hover:text-primary transition relative"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute bottom-12 right-0 bg-card border border-border rounded-lg shadow-lg z-10 min-w-max">
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2 text-left text-foreground hover:bg-primary/10 rounded-t-lg flex items-center gap-2 text-sm border-b border-border/50"
              >
                📋 Copy Link
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

      {/* Comment Input */}
      <div className="p-4 border-b border-border flex gap-4">
        <Image
          src={BLANK_PROFILE}
          alt="Your avatar"
          width={40}
          height={40}
          className="rounded-full object-cover w-10 h-10"
        />
        <form onSubmit={handleAddComment} className="flex-1">
          {commentImagePreviews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {commentImagePreviews.map((preview, index) => (
                <div key={index} className="relative inline-block">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeCommentImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-primary text-background w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-primary/90 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Post your reply..."
              className="flex-1 bg-background text-foreground outline-none placeholder:text-muted-foreground resize-none min-h-10"
              rows={newComment.split('\n').length > 1 ? 3 : 1}
            />
            <label className="cursor-pointer text-muted-foreground hover:text-foreground transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleCommentImageSelect}
                disabled={commentImages.length >= 4}
                className="hidden"
              />
              📷
            </label>
            <button
              type="submit"
              disabled={!newComment.trim() && commentImages.length === 0}
              className="text-primary font-bold hover:bg-primary/10 px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Reply
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      <div className="divide-y divide-border">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No comments yet. Be the first to reply.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-card/50 transition">
              <div className="flex gap-3">
                <Image
                  src={comment.user?.profilePic || comment.author?.profilePic || BLANK_PROFILE}
                  alt={comment.user?.name || comment.author?.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                  onError={(e) => { e.target.src = BLANK_PROFILE }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/user/profile/${comment.userId}`}
                      className="font-bold text-foreground hover:underline"
                    >
                      {comment.user?.name || comment.author?.name || 'Unknown'}
                    </Link>
                    <span className="text-muted-foreground text-sm">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-foreground mt-2 whitespace-pre-wrap">{comment.comment}</p>
                  {comment.imageUrls && comment.imageUrls.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {comment.imageUrls.map((img, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden">
                          <Image
                            src={img}
                            alt={`Comment image ${idx + 1}`}
                            width={200}
                            height={200}
                            className="w-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                    <button 
                      onClick={() => handleCommentLike(comment.id)}
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
                      <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {comment.totalLikes > 0 && <span>{comment.totalLikes}</span>}
                    </button>
                    <button 
                      onClick={() => comment.totalReplies > 0 && fetchNestedComments(comment.id)}
                      className="flex items-center gap-1 hover:text-primary transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {comment.totalReplies > 0 && <span>{comment.totalReplies}</span>}
                    </button>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="hover:text-primary transition"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Nested Comments */}
                  {expandedComments[comment.id] && (
                    <div className="mt-4 ml-6 border-l border-border/50 pl-4 space-y-4">
                      {loadingReplies[comment.id] ? (
                        <p className="text-sm text-muted-foreground">Loading replies...</p>
                      ) : (
                        nestedComments[comment.id]?.map(reply => (
                          <div key={reply.id} className="space-y-2">
                            <div className="flex gap-3">
                              <Image
                                src={reply.user?.profilePic || BLANK_PROFILE}
                                alt={reply.user?.name || 'User'}
                                width={36}
                                height={36}
                                className="rounded-full object-cover w-9 h-9"
                                onError={(e) => { e.target.src = BLANK_PROFILE }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm">{reply.user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">now</p>
                                </div>
                                <p className="text-sm text-foreground mt-1">{reply.comment}</p>
                                {reply.imageUrls && reply.imageUrls.length > 0 && (
                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    {reply.imageUrls.map((img, idx) => (
                                      <div key={idx} className="relative rounded-lg overflow-hidden">
                                        <Image
                                          src={img}
                                          alt={`Reply image ${idx + 1}`}
                                          width={150}
                                          height={150}
                                          className="w-full object-cover"
                                          onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-4 mt-2 text-muted-foreground text-sm">
                                  <button 
                                    onClick={() => handleCommentLike(reply.id)}
                                    className="flex items-center gap-1 hover:text-primary transition"
                                  >
                                    <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                    {reply.totalLikes > 0 && <span className="text-xs">{reply.totalLikes}</span>}
                                  </button>
                                  {reply.totalReplies > 0 && (
                                    <button className="flex items-center gap-1 hover:text-primary transition text-xs">
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{reply.totalReplies}</span>
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                                    className="hover:text-primary transition text-xs"
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Nested Reply Input */}
                                {replyingTo === reply.id && (
                                  <form onSubmit={(e) => handleReplyComment(e, reply.id)} className="mt-3 flex gap-2 pt-2 border-t border-border/30">
                                    <Image
                                      src={BLANK_PROFILE}
                                      alt="Your avatar"
                                      width={28}
                                      height={28}
                                      className="rounded-full object-cover w-7 h-7"
                                    />
                                    <div className="flex-1">
                                      {(replyImagePreviews[reply.id] || []).length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-1">
                                          {(replyImagePreviews[reply.id] || []).map((preview, idx) => (
                                            <div key={idx} className="relative inline-block">
                                              <Image
                                                src={preview}
                                                alt={`Preview ${idx + 1}`}
                                                width={50}
                                                height={50}
                                                className="h-12 w-12 rounded object-cover border border-border"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => removeReplyImage(reply.id, idx)}
                                                className="absolute -top-1 -right-1 rounded-full bg-primary text-background w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-primary/90 transition"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      <div className="flex gap-2 items-end">
                                        <textarea
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          placeholder="Post your reply..."
                                          className="flex-1 bg-background text-foreground text-xs outline-none placeholder:text-muted-foreground resize-none min-h-7"
                                          rows={replyText.split('\n').length > 1 ? 2 : 1}
                                          autoFocus
                                        />
                                        <label className="cursor-pointer text-muted-foreground hover:text-foreground transition text-xs">
                                          <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleReplyImageSelect(reply.id, e)}
                                            disabled={(replyImages[reply.id] || []).length >= 4}
                                            className="hidden"
                                          />
                                          📷
                                        </label>
                                        <button
                                          type="submit"
                                          disabled={!replyText.trim() && (replyImages[reply.id] || []).length === 0}
                                          className="text-primary font-bold text-xs hover:bg-primary/10 px-2 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <form onSubmit={(e) => handleReplyComment(e, comment.id)} className="mt-4 flex gap-3 pl-6">
                      <Image
                        src={BLANK_PROFILE}
                        alt="Your avatar"
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-2">Replying to @{comment.user?.name || comment.author?.name}</p>
                        {(replyImagePreviews[comment.id] || []).length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {(replyImagePreviews[comment.id] || []).map((preview, idx) => (
                              <div key={idx} className="relative inline-block">
                                <Image
                                  src={preview}
                                  alt={`Preview ${idx + 1}`}
                                  width={60}
                                  height={60}
                                  className="h-16 w-16 rounded object-cover border border-border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeReplyImage(comment.id, idx)}
                                  className="absolute -top-1 -right-1 rounded-full bg-primary text-background w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-primary/90 transition"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 items-end">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Post your reply..."
                            className="flex-1 bg-background text-foreground text-sm outline-none placeholder:text-muted-foreground resize-none min-h-9"
                            rows={replyText.split('\n').length > 1 ? 3 : 1}
                            autoFocus
                          />
                          <label className="cursor-pointer text-muted-foreground hover:text-foreground transition text-sm">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleReplyImageSelect(comment.id, e)}
                              disabled={(replyImages[comment.id] || []).length >= 4}
                              className="hidden"
                            />
                            📷
                          </label>
                          <button
                            type="submit"
                            disabled={!replyText.trim() && (replyImages[comment.id] || []).length === 0}
                            className="text-primary font-bold hover:bg-primary/10 px-3 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
