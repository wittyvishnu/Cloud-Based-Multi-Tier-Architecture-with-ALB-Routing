'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authAPI } from '@/lib/api'
import { Upload, X, Edit2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import FollowersModal from './FollowersModal'
import FollowingModal from './FollowingModal'
import ImageCropper from '../ImageCropper'
import ProfilePosts from './ProfilePosts'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function EditableProfile({ userId, onProfileUpdate }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const fileInputRef = useRef(null)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [cropImage, setCropImage] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: [],
  })
  const [skillInput, setSkillInput] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile(userId)
        setProfile(response.data.user)
        setFormData({
          name: response.data.user.name,
          bio: response.data.user.bio || '',
          skills: response.data.user.skills || [],
        })
      } catch (error) {
        console.error('[v0] Failed to fetch profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }))
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const response = await authAPI.updateProfile({
        name: formData.name,
        bio: formData.bio,
        skills: formData.skills,
      })

      const updatedUser = response.data.user
      setProfile((prev) => ({
        ...prev,
        ...updatedUser,
      }))

      const user = JSON.parse(localStorage.getItem('user'))
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          name: updatedUser.name,
          bio: updatedUser.bio,
          skills: updatedUser.skills,
        })
      )

      toast.success('Profile updated successfully!')
      setEditing(false)
      onProfileUpdate?.()
    } catch (error) {
      console.error('[v0] Failed to update profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePictureUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setCropImage(event.target?.result)
      setShowCropper(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (blob) => {
    setShowCropper(false)
    setUploadingPicture(true)
    
    try {
      const formDataObj = new FormData()
      formDataObj.append('profilePicture', blob, 'profile.jpg')

      const response = await authAPI.updateProfilePicture(formDataObj)

      setProfile((prev) => ({
        ...prev,
        profilePic: response.data.profilePic,
      }))

      const user = JSON.parse(localStorage.getItem('user'))
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          profilePic: response.data.profilePic,
        })
      )

      toast.success('Profile picture updated!')
    } catch (error) {
      console.error('[v0] Failed to upload picture:', error)
      toast.error('Failed to upload picture')
    } finally {
      setUploadingPicture(false)
      setCropImage(null)
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
            <div className="flex-shrink-0 relative group">
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPicture}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg transition-all disabled:opacity-50"
              >
                <Upload className="w-6 h-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePictureUpload}
                disabled={uploadingPicture}
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex-1">
                  {editing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-base font-semibold text-foreground mb-2">
                          Name
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="bg-card border-border text-foreground text-lg py-2 px-3"
                        />
                      </div>

                      <div>
                        <label className="block text-base font-semibold text-foreground mb-2">
                          Bio
                        </label>
                        <Input
                          type="text"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself..."
                          className="bg-card border-border text-foreground py-2 px-3"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                        {profile.name}
                      </h1>
                      <p className="text-base sm:text-lg text-muted-foreground mb-3">{profile.email}</p>
                      {profile.bio && (
                        <p className="text-base text-foreground leading-relaxed">
                          {profile.bio}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Edit Button */}
                {!editing && (
                  <Button
                    onClick={() => setEditing(true)}
                    className="w-full sm:w-auto py-3 px-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Edit2 className="w-5 h-5 mr-2 inline" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Save/Cancel Buttons */}
              {editing && (
                <div className="flex gap-3 mb-6">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 sm:flex-none py-3 px-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="w-5 h-5 mr-2 inline" />
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        name: profile.name,
                        bio: profile.bio || '',
                        skills: profile.skills || [],
                      })
                    }}
                    variant="outline"
                    className="flex-1 sm:flex-none py-3 px-6 text-base font-semibold"
                  >
                    <X className="w-5 h-5 mr-2 inline" />
                    Cancel
                  </Button>
                </div>
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
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">Skills & Expertise</h2>

          {editing ? (
            <div className="space-y-5">
              <div className="flex gap-2 flex-col sm:flex-row">
                <Input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSkill()
                    }
                  }}
                  placeholder="e.g., Node.js, Docker, Kubernetes"
                  className="bg-card border-border text-foreground flex-1 py-2 px-3"
                />
                <Button
                  onClick={handleAddSkill}
                  className="w-full sm:w-auto py-2 px-6 text-base font-semibold"
                >
                  Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-primary/10 text-primary px-4 py-2 rounded-full text-base font-semibold flex items-center gap-2 border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-primary/70 transition-colors ml-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary px-4 sm:px-5 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-base">No skills added yet. Click Edit Profile to add your skills.</p>
              )}
            </>
          )}
        </div>

        {/* Posts Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-5">Posts</h2>
          <ProfilePosts userId={userId} currentUserId={userId} />
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
      {showCropper && cropImage && (
        <ImageCropper
          imageSource={cropImage}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setCropImage(null)
          }}
        />
      )}
    </div>
  )
}
