'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { postAPI } from '@/lib/api'
import { X, Image as ImageIcon, ArrowLeft, Share2 } from 'lucide-react'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [post, setPost] = useState(null)
  const [text, setText] = useState('')
  const [newImages, setNewImages] = useState([])
  const [newImagePreviews, setNewImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [removedImages, setRemovedImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData) {
      setUser(userData)
    }
  }, [])

  useEffect(() => {
    if (params.id && user) {
      fetchPost()
    }
  }, [params.id, user])

  const fetchPost = async () => {
    try {
      const response = await postAPI.getPostById(params.id)
      const postData = response.data.post || response.data
      setPost(postData)
      setText(postData.text || '')
      setExistingImages(postData.imageUrls || [])
    } catch (error) {
      console.log('[v0] Failed to fetch post:', error)
      toast.error('Failed to load post')
      router.push('/user/posts')
    } finally {
      setPageLoading(false)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = existingImages.length - removedImages.length + newImages.length + files.length

    if (totalImages > 4) {
      toast.error('Maximum 4 images allowed (including existing images)')
      return
    }

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setNewImages(prev => [...prev, file])
        setNewImagePreviews(prev => [...prev, event.target.result])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (index) => {
    const imageUrl = existingImages[index]
    setRemovedImages(prev => [...prev, imageUrl])
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/user/posts/${params.id}`
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

  const handleUpdate = async () => {
    if (!text.trim()) {
      toast.error('Please write something')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('text', text.trim())
      
      // Append existing images that weren't removed
      existingImages.forEach(imageUrl => {
        formData.append('existingImages', imageUrl)
      })

      // Append new images
      newImages.forEach(image => {
        formData.append('images', image)
      })

      const response = await postAPI.updatePost(params.id, formData)
      toast.success('Post updated successfully')
      router.push(`/user/posts/${params.id}`)
    } catch (error) {
      console.log('[v0] Update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  if (!user || pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalImages = existingImages.length + newImages.length

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="hover:bg-primary/10 rounded-full p-2 transition text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="hover:bg-primary/10 rounded-full p-2 transition text-foreground"
            title="Share post"
          >
            <Share2 className="w-5 h-5" />
          </button>
          
          {showShareMenu && (
            <div className="absolute top-12 right-0 bg-card border border-border rounded-lg shadow-lg z-10 min-w-max">
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

      <div className="border-b border-border p-4 space-y-4">
        {/* User Info */}
        <div className="flex gap-4">
          <Image
            src={user.profilePic || BLANK_PROFILE}
            alt={user.name}
            width={56}
            height={56}
            className="rounded-full object-cover"
            onError={(e) => { e.target.src = BLANK_PROFILE }}
          />
          <div>
            <p className="font-bold text-base text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">@{user.name?.toLowerCase().replace(/\s/g, '')}</p>
          </div>
        </div>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening?!"
          className="w-full bg-transparent text-2xl text-foreground placeholder:text-muted-foreground resize-none outline-none border-none p-0"
          rows={6}
        />

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Existing Images</p>
            <div className={`grid gap-2 rounded-2xl overflow-hidden ${
              existingImages.length === 1 ? 'grid-cols-1' :
              existingImages.length === 2 ? 'grid-cols-2' :
              existingImages.length === 3 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {existingImages.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className={`relative bg-muted overflow-hidden group ${
                    existingImages.length === 3 && idx === 2 ? 'col-span-2' : ''
                  }`}
                  style={{ aspectRatio: '1/1' }}
                >
                  <Image
                    src={imageUrl}
                    alt={`Existing ${idx}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Image Previews */}
        {newImagePreviews.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">New Images ({newImages.length})</p>
            <div className={`grid gap-2 rounded-2xl overflow-hidden ${
              newImagePreviews.length === 1 ? 'grid-cols-1' :
              newImagePreviews.length === 2 ? 'grid-cols-2' :
              newImagePreviews.length === 3 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {newImagePreviews.map((preview, idx) => (
                <div
                  key={idx}
                  className={`relative bg-muted overflow-hidden group ${
                    newImagePreviews.length === 3 && idx === 2 ? 'col-span-2' : ''
                  }`}
                  style={{ aspectRatio: '1/1' }}
                >
                  <Image
                    src={preview}
                    alt={`New ${idx}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Count Info */}
        <p className="text-xs text-muted-foreground">
          Total images: {totalImages}/4
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={totalImages >= 4}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= 4}
              className="hover:bg-primary/10 rounded-full p-2 transition text-primary disabled:opacity-50"
              title={totalImages >= 4 ? 'Maximum 4 images reached' : 'Add images'}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          <Button
            onClick={handleUpdate}
            disabled={loading || !text.trim()}
            className="rounded-full px-8 font-bold text-base"
          >
            {loading ? 'Updating...' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  )
}
