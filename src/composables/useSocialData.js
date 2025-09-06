// src/composables/useSocialData.js
// Composable tổng hợp quản lý tất cả dữ liệu social media (posts, friends, selection)

import { ref } from 'vue'

// Mock data cho posts
const mockPosts = [
  {
    id: 1,
    title: "Exploring the Mountains",
    shortContent: "Just came back from an amazing hiking trip in the mountains! The views were breathtaking...",
    content: "Just came back from an amazing hiking trip in the mountains! The views were breathtaking, and the fresh air was so refreshing. Highly recommend visiting the Alps if you get the chance!",
    author: "Admin",
    timestamp: "2 hours ago",
    image: "/src/assets/img/post1.jpg",
    likes: 123,
    comments: [
      { user: "User Name", text: "Great post! Loving the content." },
      { user: "Another User", text: "Thanks for sharing!" }
    ]
  },
  {
    id: 2,
    title: "New Recipe Discovery",
    shortContent: "Tried a new pasta recipe today, and it was a hit with the family! Sharing the recipe soon...",
    content: "Tried a new pasta recipe today, and it was a hit with the family! Sharing the recipe soon, stay tuned for some deliciousness!",
    author: "Alice Johnson",
    timestamp: "4 hours ago",
    image: "/src/assets/img/post2.jpg",
    likes: 85,
    comments: [
      { user: "User Name", text: "Can't wait to try this recipe!" },
      { user: "Another User", text: "Looks delicious!" }
    ]
  },
  {
    id: 3,
    title: "City Adventure",
    shortContent: "Spent the day exploring the city streets and discovered some amazing street art!",
    content: "Spent the day exploring the city streets and discovered some amazing street art! The urban vibe was incredible, and I found some hidden gems.",
    author: "Bob Smith",
    timestamp: "6 hours ago",
    image: "/src/assets/img/post3.jpg",
    likes: 56,
    comments: [
      { user: "User Name", text: "Love the street art!" },
      { user: "Another User", text: "Which city was this?" }
    ]
  },
  {
    id: 4,
    title: "Beach Day",
    shortContent: "Nothing beats a relaxing day at the beach with friends and family.",
    content: "Nothing beats a relaxing day at the beach with friends and family. The sound of the waves and the warm sun made it a perfect day!",
    author: "Carol White",
    timestamp: "8 hours ago",
    image: "/src/assets/img/post4.jpg",
    likes: 92,
    comments: [
      { user: "User Name", text: "Looks so relaxing!" },
      { user: "Another User", text: "Wish I was there!" }
    ]
  },
  {
    id: 5,
    title: "Morning Coffee",
    shortContent: "Starting the day with a perfect cup of coffee and a good book.",
    content: "Starting the day with a perfect cup of coffee and a good book. Nothing sets the mood better than this combo!",
    author: "David Brown",
    timestamp: "10 hours ago",
    image: "/src/assets/img/post5.jpg",
    likes: 78,
    comments: [
      { user: "User Name", text: "What's the book you're reading?" },
      { user: "Another User", text: "Coffee vibes!" }
    ]
  }
]

// Mock data cho friends
const mockFriends = [
  { id: 1, name: "Alice Johnson" },
  { id: 2, name: "Bob Smith" },
  { id: 3, name: "Carol White" },
  { id: 4, name: "David Brown" }
]

// States reactive để lưu trữ dữ liệu
const posts = ref(mockPosts)
const friends = ref(mockFriends)
const selectedPostId = ref(null)

export function useSocialData() {
  // === POSTS FUNCTIONS ===
  
  // Lấy tất cả posts
  const getAllPosts = () => {
    return posts.value
  }
  
  // Lấy post theo ID
  const getPostById = (id) => {
    return posts.value.find(post => post.id === parseInt(id))
  }
  
  // Thêm post mới
  const addPost = (newPost) => {
    const post = {
      id: Date.now(), // Tạo ID đơn giản
      ...newPost,
      likes: 0,
      comments: [],
      timestamp: 'Just now'
    }
    posts.value.unshift(post) // Thêm vào đầu danh sách
    return post
  }
  
  // Cập nhật số like
  const updateLikes = (postId, newLikeCount) => {
    const post = getPostById(postId)
    if (post) {
      post.likes = newLikeCount
    }
  }
  
  // Thêm comment vào post
  const addComment = (postId, comment) => {
    const post = getPostById(postId)
    if (post) {
      post.comments.push(comment)
    }
  }
  
  // === FRIENDS FUNCTIONS ===
  
  // Lấy tất cả bạn bè
  const getAllFriends = () => {
    return friends.value
  }
  
  // Lấy bạn bè theo ID
  const getFriendById = (id) => {
    return friends.value.find(friend => friend.id === parseInt(id))
  }
  
  // Thêm bạn bè mới
  const addFriend = (newFriend) => {
    const friend = {
      id: Date.now(), // Tạo ID đơn giản
      ...newFriend
    }
    friends.value.push(friend)
    return friend
  }
  
  // Xóa bạn bè
  const removeFriend = (friendId) => {
    const index = friends.value.findIndex(friend => friend.id === parseInt(friendId))
    if (index !== -1) {
      friends.value.splice(index, 1)
      return true
    }
    return false
  }
  
  // Tìm kiếm bạn bè theo tên
  const searchFriends = (searchTerm) => {
    return friends.value.filter(friend => 
      friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }
  
  // === POST SELECTION FUNCTIONS ===
  
  // Thiết lập post được chọn
  const setSelectedPost = (postId) => {
    selectedPostId.value = postId
  }
  
  // Xóa selection
  const clearSelection = () => {
    selectedPostId.value = null
  }
  
  // Kiểm tra post có được chọn không
  const isPostSelected = (postId) => {
    return selectedPostId.value === postId
  }
  
  // Lấy post được chọn hiện tại
  const getSelectedPost = () => {
    return selectedPostId.value ? getPostById(selectedPostId.value) : null
  }
  
  return {
    // Data
    posts: posts.value,
    friends: friends.value,
    selectedPostId,
    
    // Posts functions
    getAllPosts,
    getPostById,
    addPost,
    updateLikes,
    addComment,
    
    // Friends functions
    getAllFriends,
    getFriendById,
    addFriend,
    removeFriend,
    searchFriends,
    
    // Selection functions
    setSelectedPost,
    clearSelection,
    isPostSelected,
    getSelectedPost
  }
}