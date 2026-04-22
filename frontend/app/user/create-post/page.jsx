'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { postAPI } from '@/lib/api'
import { X, Image as ImageIcon } from 'lucide-react'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function CreatePostPage() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (userData) {
      setUser(userData)
    }
  }, [])

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = images.length + files.length

    if (totalImages > 4) {
      toast.error('Maximum 4 images allowed')
      return
    }

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, file])
        setImagePreviews(prev => [...prev, event.target.result])
      }
      reader.readAsDataURL(file)
    })

    // Reset input
    e.target.value = ''
  }

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!text.trim()) {
      toast.error('Please write something')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('text', text)
      images.forEach(image => {
        formData.append('images', image)
      })

      const response = await postAPI.createPost(formData)
      toast.success('Post created successfully')
      router.push('/user/posts')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground">Create Post</h1>
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

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className={`grid gap-2 rounded-2xl overflow-hidden ${
            imagePreviews.length === 1 ? 'grid-cols-1' :
            imagePreviews.length === 2 ? 'grid-cols-2' :
            imagePreviews.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {imagePreviews.map((preview, idx) => (
              <div
                key={idx}
                className={`relative bg-muted overflow-hidden group ${
                  imagePreviews.length === 3 && idx === 2 ? 'col-span-2' : ''
                }`}
                style={{ aspectRatio: '1/1' }}
              >
                <Image
                  src={preview}
                  alt={`Preview ${idx}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

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
              disabled={images.length >= 4}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= 4}
              className="hover:bg-primary/10 rounded-full p-2 transition text-primary disabled:opacity-50"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>

          <Button
            onClick={handlePost}
            disabled={loading || !text.trim()}
            className="rounded-full px-8 font-bold text-base"
          >
            {loading ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}
