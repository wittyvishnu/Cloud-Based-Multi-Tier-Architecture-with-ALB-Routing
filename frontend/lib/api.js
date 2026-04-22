import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export const authAPI = {
  register: async (data) => {
    return apiClient.post('/auth/register', data)
  },
  login: async (data) => {
    return apiClient.post('/auth/login', data)
  },
  verifyToken: async () => {
    return apiClient.get('/auth/verify-token')
  },
  getProfile: async (userId) => {
    return apiClient.get(`/auth/profile/${userId}`)
  },
  updateProfile: async (data) => {
    return apiClient.put('/auth/update-profile', data)
  },
  updateProfilePicture: async (formData) => {
    return apiClient.put('/auth/update-profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

export const userAPI = {
  getFollowing: async (userId, page = 1) => {
    return apiClient.get(`/users/${userId}/following?page=${page}`)
  },
  getFollowers: async (userId, page = 1) => {
    return apiClient.get(`/users/${userId}/followers?page=${page}`)
  },
  getFollowStatus: async (userId) => {
    return apiClient.get(`/users/${userId}/status`)
  },
  toggleFollow: async (userId) => {
    return apiClient.post(`/users/${userId}/toggle-follow`)
  },
}

export const postAPI = {
  createPost: async (formData) => {
    return apiClient.post('/posts/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getForYouPosts: async (page = 1) => {
    return apiClient.get(`/posts/for-you?page=${page}`)
  },
  getFollowingPosts: async (page = 1) => {
    return apiClient.get(`/posts/following?page=${page}`)
  },
  getUserPosts: async (userId, page = 1) => {
    return apiClient.get(`/posts/user/${userId}?page=${page}`)
  },
  getPostById: async (postId) => {
    return apiClient.get(`/posts/${postId}`)
  },
  updatePost: async (postId, formData) => {
    return apiClient.put(`/posts/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deletePost: async (postId) => {
    return apiClient.delete(`/posts/${postId}`)
  },
  toggleLike: async (postId) => {
    return apiClient.post(`/posts/${postId}/toggle-like`)
  },
  sharePost: async (postId) => {
    return apiClient.post(`/posts/${postId}/share`)
  },
}

export const commentAPI = {
  createComment: async (data) => {
    const formData = new FormData()
    formData.append('comment', data.comment)
    if (data.postId) formData.append('postId', data.postId)
    if (data.commentId) formData.append('commentId', data.commentId)
    if (data.images) {
      data.images.forEach((image) => formData.append('images', image))
    }
    return apiClient.post('/comments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getPostComments: async (postId, page = 1) => {
    return apiClient.get(`/comments/${postId}?type=post&page=${page}`)
  },
  getCommentReplies: async (commentId, page = 1) => {
    return apiClient.get(`/comments/${commentId}?type=comment&page=${page}`)
  },
  toggleLike: async (commentId) => {
    return apiClient.post(`/comments/${commentId}/toggle-like`)
  },
}

export const notificationAPI = {
  getNotifications: async (page = 1) => {
    return apiClient.get(`/notifications?page=${page}`)
  },
  getUnreadNotifications: async (page = 1) => {
    return apiClient.get(`/notifications/unread?page=${page}`)
  },
  markNotificationAsRead: async (notificationId) => {
    return apiClient.put(`/notifications/${notificationId}/read`)
  },
}
