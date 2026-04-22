'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { commentAPI } from '@/lib/api'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function CommentsModal({ postId, isOpen, onClose, currentUserId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [selectedImages, setSelectedImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  useEffect(() => {
    if (!isOpen || !postId) return
    fetchComments()
  }, [isOpen, postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await commentAPI.getPostComments(postId)
      setComments(response.data.comments || response.data || [])
    } catch (error) {
      console.error('Failed to load comments', error)
      toast.error('Unable to load comments')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || [])
    const maxImages = 4
    
    if (selectedImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const newFiles = files.slice(0, maxImages - selectedImages.length)
    setSelectedImages(prev => [...prev, ...newFiles])

    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddComment = async (event) => {
    event.preventDefault()
    if (!newComment.trim() && selectedImages.length === 0) return

    try {
      const response = await commentAPI.createComment({ 
        postId, 
        comment: newComment.trim(),
        images: selectedImages
      })
      setComments(prev => [response.data.comment || response.data, ...prev])
      setNewComment('')
      setSelectedImages([])
      setImagePreviews([])
      toast.success('Comment added')
    } catch (error) {
      console.error('Failed to post comment', error)
      toast.error('Unable to add comment')
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Comments</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 bg-muted p-6 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to reply.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id || comment._id || `${comment.postId}-${comment.createdAt}`} className="flex gap-3 rounded-3xl border border-border/50 bg-background p-4">
                <Image
                  src={comment.author?.profilePic || BLANK_PROFILE}
                  alt={comment.author?.name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  onError={(event) => { event.currentTarget.src = BLANK_PROFILE }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-foreground truncate">{comment.author?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(comment.createdAt || comment.updatedAt || Date.now()).toLocaleString()}</p>
                    </div>
                    {comment.userId === currentUserId && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        You
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{comment.comment || comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="border-t border-border/50 px-5 py-4">
          <label className="sr-only" htmlFor="new-comment">Add Comment</label>
          
          {/* Image previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {imagePreviews.map((preview, index) => (
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
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 rounded-full bg-primary text-background w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-primary/90 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="flex gap-2 items-end">
            <textarea
              id="new-comment"
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none min-h-12"
              rows={newComment.split('\n').length > 1 ? 3 : 1}
            />
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-3xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={selectedImages.length >= 4}
                  className="hidden"
                />
                📷
              </label>
              <button
                type="submit"
                className="rounded-3xl bg-primary px-4 py-3 text-sm font-semibold text-background transition hover:bg-primary/90"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
