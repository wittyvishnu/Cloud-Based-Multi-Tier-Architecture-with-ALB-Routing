'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { notificationAPI } from '@/lib/api'

const BLANK_PROFILE = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png'

export default function Notifications() {
  const [tab, setTab] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [markingAsRead, setMarkingAsRead] = useState({})
  const observerTarget = useRef(null)

  useEffect(() => {
    setCurrentPage(1)
    setNotifications([])
    setTotalPages(1)
  }, [tab])

  const fetchNotifications = useCallback(async (page) => {
    setLoading(true)
    try {
      const response = tab === 'all' 
        ? await notificationAPI.getNotifications(page)
        : await notificationAPI.getUnreadNotifications(page)
      
      const newNotifications = response.data?.notifications || []
      const totalPagesFromAPI = response.data?.count || 1
      
      if (page === 1) {
        setNotifications(newNotifications)
      } else {
        setNotifications(prev => [...prev, ...newNotifications])
      }
      
      setTotalPages(totalPagesFromAPI)
      setCurrentPage(page)
    } catch (error) {
      console.log('[v0] Failed to fetch notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchNotifications(1)
  }, [tab, fetchNotifications])

  useEffect(() => {
    if (!observerTarget.current || currentPage >= totalPages || loading) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && currentPage < totalPages && !loading) {
          fetchNotifications(currentPage + 1)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [totalPages, loading, currentPage, fetchNotifications])

  const handleMarkAsRead = async (notificationId, isRead) => {
    if (isRead) return
    
    setMarkingAsRead(prev => ({ ...prev, [notificationId]: true }))
    try {
      await notificationAPI.markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
      toast.success('Marked as read')
    } catch (error) {
      console.log('[v0] Failed to mark as read:', error)
      toast.error('Failed to mark as read')
    } finally {
      setMarkingAsRead(prev => ({ ...prev, [notificationId]: false }))
    }
  }

  const formatDate = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diff = now - notifDate
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return notifDate.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return '👤'
      case 'like_post':
        return '❤️'
      case 'like_comment':
        return '❤️'
      case 'comment_post':
        return '💬'
      case 'comment_comment':
        return '💬'
      default:
        return '🔔'
    }
  }

  const getNotificationAction = (type) => {
    switch (type) {
      case 'follow':
        return 'followed you'
      case 'like_post':
        return 'liked your post'
      case 'like_comment':
        return 'liked your reply'
      case 'comment_post':
        return 'replied to your post'
      case 'comment_comment':
        return 'replied to your comment'
      default:
        return 'interacted with you'
    }
  }

  const getNotificationLink = (notification) => {
    const { type, actor, targetId } = notification
    
    switch (type) {
      case 'follow':
        return `/user/profile/${actor?.id}`
      case 'like_post':
      case 'comment_post':
        return `/user/posts/${targetId}`
      case 'like_comment':
      case 'comment_comment':
        return `/user/posts/${targetId}`
      default:
        return '#'
    }
  }

  const renderNotificationContent = (notification) => {
    const { type, actor, post, comment, targetComment } = notification
    const actorName = actor?.name || 'Someone'
    const actorProfile = actor?.profilePic || BLANK_PROFILE
    const icon = getNotificationIcon(type)
    const action = getNotificationAction(type)
    const href = getNotificationLink(notification)

    const handleClick = (e) => {
      if (notification.isRead === false) {
        handleMarkAsRead(notification.id, false)
      }
    }

    return (
      <Link
        href={href}
        onClick={handleClick}
        className={`w-full block transition-all ${
          !notification.isRead ? 'bg-primary/10 hover:bg-primary/15 border-primary/30' : 'hover:bg-muted border-border'
        } rounded-lg p-4 border`}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="text-2xl flex-shrink-0 pt-0.5">{icon}</div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header with name and action */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-foreground">{actorName}</span>
                <span className="text-foreground">{action}</span>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDate(notification.createdAt)}
              </span>
            </div>

            {/* Preview content */}
            {(type === 'like_post' || type === 'comment_post') && post && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {post.text || 'Untitled post'}
              </p>
            )}

            {(type === 'like_comment' || type === 'comment_comment') && comment && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {comment.text || 'Comment'}
              </p>
            )}

            {type === 'comment_post' && comment && post && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {post.text || 'Untitled post'}
                </p>
                <p className="text-sm text-foreground">
                  {comment.text || 'No text'}
                </p>
              </div>
            )}

            {type === 'comment_comment' && targetComment && comment && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {targetComment.text || 'Comment'}
                </p>
                <p className="text-sm text-foreground">
                  {comment.text || 'No text'}
                </p>
              </div>
            )}
          </div>

          {/* Profile picture on right */}
          {actor && (
            <Image
              src={actorProfile}
              alt={actorName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10 flex-shrink-0"
              onError={(e) => { e.target.src = BLANK_PROFILE }}
            />
          )}
        </div>
      </Link>
    )
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Notifications</h1>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Notifications</h1>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-border mb-6">
          <button
            onClick={() => setTab('all')}
            className={`pb-4 font-semibold transition-colors ${
              tab === 'all'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTab('unread')}
            className={`pb-4 font-semibold transition-colors ${
              tab === 'unread'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id}>
                {renderNotificationContent(notification)}
              </div>
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
        )}
      </div>
    </div>
  )
}
