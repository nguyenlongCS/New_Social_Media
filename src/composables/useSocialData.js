/*
src/composables/useSocialData.js - Refactored
Composable quản lý dữ liệu social media (posts, friends, selection)
Loại bỏ code dư thừa, giữ nguyên chức năng cốt lõi
*/
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

// States reactive
const posts = ref(mockPosts)
const friends = ref(mockFriends)
const selectedPostId = ref(null)

export function useSocialData() {
  // Lấy post theo ID
  const getPostById = (id) => {
    return posts.value.find(post => post.id === parseInt(id))
  }
  
  // Thiết lập post được chọn
  const setSelectedPost = (postId) => {
    selectedPostId.value = postId
  }
  
  // Lấy post được chọn hiện tại
  const getSelectedPost = () => {
    return selectedPostId.value ? getPostById(selectedPostId.value) : null
  }
  
  return {
    posts: posts.value,
    friends: friends.value,
    selectedPostId,
    getPostById,
    setSelectedPost,
    getSelectedPost
  }
}