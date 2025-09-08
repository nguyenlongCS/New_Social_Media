/*
src/composables/useUsers.js - Simplified Version
Đơn giản hóa để tránh Firestore connection errors trong dev
Logic: Basic user sync without complex Firestore operations
*/

export function useUsers() {
  // Simplified sync function để tránh Firestore errors trong development
  const syncUserToFirestore = async (firebaseUser) => {
    if (!firebaseUser) {
      console.warn('No user provided for sync')
      return null
    }

    try {
      // Log user info for debugging
      console.log('User authenticated:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      })

      // In development, just return the user without Firestore operations
      // để tránh database connection issues
      return {
        UserID: firebaseUser.uid,
        UserName: firebaseUser.displayName || 'User',
        Email: firebaseUser.email,
        Avatar: firebaseUser.photoURL,
        Provider: getProviderFromFirebaseUser(firebaseUser)
      }
    } catch (error) {
      console.error('User sync error:', error)
      return null
    }
  }

  // Helper function để detect provider
  const getProviderFromFirebaseUser = (firebaseUser) => {
    if (firebaseUser.providerData?.length > 0) {
      const providerId = firebaseUser.providerData[0].providerId
      if (providerId === 'google.com') return 'google'
      if (providerId === 'facebook.com') return 'facebook'
    }
    return 'email'
  }

  // Simplified getUserById
  const getUserById = async (userId) => {
    console.log('getUserById called with:', userId)
    // Return mock data for development
    return {
      id: userId,
      UserID: userId,
      UserName: 'Test User',
      Email: 'test@example.com',
      Avatar: null
    }
  }

  return {
    syncUserToFirestore,
    getUserById
  }
}