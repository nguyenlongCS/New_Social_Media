/*
src/composables/useLocation.js - Composable quản lý vị trí và tìm bạn bè xung quanh
Logic xử lý geolocation, tính khoảng cách, lưu/lấy vị trí từ Firestore collection "locations"
Tích hợp Mapbox để hiển thị bản đồ và pin user
*/
import { ref } from 'vue'
import { 
  collection, 
  doc,
  query, 
  where, 
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '@/firebase/config'

// Mapbox access token 
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibG9uZ25ndXllbjIwMDQiLCJhIjoiY21leHo0dTZ5MTlwZjJtbXdvdjlpbm5vNSJ9.HrXVxi7vT0CIJKkVqwtTIQ'

export function useLocation() {
  // State quản lý vị trí
  const currentLocation = ref(null) // { lat, lng }
  const nearbyUsers = ref([])
  const isGettingLocation = ref(false)
  const isLoadingNearby = ref(false)
  const errorMessage = ref('')
  const permissionDenied = ref(false)
  
  // Map states
  const mapInstance = ref(null)
  const markers = ref([])
  
  // View mode: 'map' hoặc 'list'
  const viewMode = ref('map')
  
  // Tính khoảng cách giữa 2 điểm sử dụng Haversine formula (km)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371 // Radius trái đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
  
  // Format khoảng cách để hiển thị
  const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
      return Math.round(distanceKm * 1000) + 'm'
    }
    return distanceKm.toFixed(1) + 'km'
  }
  
  // Lấy vị trí hiện tại từ browser geolocation
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ geolocation'))
        return
      }
      
      isGettingLocation.value = true
      errorMessage.value = ''
      permissionDenied.value = false
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          currentLocation.value = location
          isGettingLocation.value = false
          resolve(location)
        },
        (error) => {
          isGettingLocation.value = false
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              permissionDenied.value = true
              errorMessage.value = 'Người dùng từ chối chia sẻ vị trí'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage.value = 'Không thể xác định vị trí'
              break
            case error.TIMEOUT:
              errorMessage.value = 'Timeout khi lấy vị trí'
              break
            default:
              errorMessage.value = 'Lỗi không xác định khi lấy vị trí'
          }
          
          reject(new Error(errorMessage.value))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 phút
        }
      )
    })
  }
  
  // Lưu vị trí user lên Firestore collection "locations"
  const saveUserLocation = async (userId, location) => {
    if (!userId || !location) return
    
    try {
      const locationRef = doc(db, 'locations', userId)
      await setDoc(locationRef, {
        userID: userId,
        latitude: location.lat,
        longitude: location.lng,
        updatedAt: serverTimestamp()
      })
      
      console.log('Location saved for user:', userId)
    } catch (error) {
      console.error('Error saving location:', error)
      throw new Error('Không thể lưu vị trí')
    }
  }
  
  // Lấy danh sách user có vị trí từ Firestore và tính khoảng cách
  const getNearbyUsers = async (currentUserId, userLocation, radiusKm = 10) => {
    if (!userLocation || !currentUserId) return []
    
    isLoadingNearby.value = true
    
    try {
      // Lấy tất cả locations từ Firestore
      const locationsQuery = query(collection(db, 'locations'))
      const locationsSnapshot = await getDocs(locationsQuery)
      
      const nearbyUsersList = []
      
      for (const locationDoc of locationsSnapshot.docs) {
        const locationData = locationDoc.data()
        
        // Skip user hiện tại
        if (locationData.userID === currentUserId) continue
        
        // Tính khoảng cách
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          locationData.latitude,
          locationData.longitude
        )
        
        // Chỉ lấy user trong bán kính
        if (distance <= radiusKm) {
          // Lấy thông tin user từ collection users
          const usersQuery = query(
            collection(db, 'users'),
            where('UserID', '==', locationData.userID)
          )
          const usersSnapshot = await getDocs(usersQuery)
          
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data()
            
            nearbyUsersList.push({
              userId: locationData.userID,
              userName: userData.UserName || 'Anonymous',
              avatar: userData.Avatar || '',
              email: userData.Email || '',
              bio: userData.Bio || '',
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              distance: distance,
              distanceText: formatDistance(distance),
              updatedAt: locationData.updatedAt
            })
          }
        }
      }
      
      // Sắp xếp theo khoảng cách gần nhất
      nearbyUsersList.sort((a, b) => a.distance - b.distance)
      
      nearbyUsers.value = nearbyUsersList
      return nearbyUsersList
      
    } catch (error) {
      console.error('Error getting nearby users:', error)
      errorMessage.value = 'Không thể tải danh sách người dùng xung quanh'
      return []
    } finally {
      isLoadingNearby.value = false
    }
  }
  
  // Xóa vị trí user khi không muốn chia sẻ nữa
  const removeUserLocation = async (userId) => {
    if (!userId) return
    
    try {
      const locationRef = doc(db, 'locations', userId)
      await deleteDoc(locationRef)
      
      currentLocation.value = null
      nearbyUsers.value = []
      
      console.log('Location removed for user:', userId)
    } catch (error) {
      console.error('Error removing location:', error)
      throw new Error('Không thể xóa vị trí')
    }
  }
  
  // Khởi tạo Mapbox map
  const initializeMap = (container, options = {}) => {
    if (!window.mapboxgl) {
      console.error('Mapbox GL JS chưa được tải')
      return null
    }
    
    // Set access token
    window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
    
    const defaultOptions = {
      container: container,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [106.6297, 10.8231], // TP.HCM default
      zoom: 12
    }
    
    const map = new window.mapboxgl.Map({
      ...defaultOptions,
      ...options
    })
    
    // Đảm bảo map được load hoàn toàn trước khi trả về
    map.on('load', () => {
      console.log('Map loaded successfully')
    })
    
    map.on('error', (e) => {
      console.error('Map error:', e)
    })
    
    mapInstance.value = map
    return map
  }
  
  // Thêm marker cho user hiện tại
  const addCurrentUserMarker = (map, location, userName = 'Bạn') => {
    if (!map || !location) return null
    
    // Tạo custom marker cho user hiện tại (màu khác)
    const marker = new window.mapboxgl.Marker({ color: 'red' })
      .setLngLat([location.lng, location.lat])
      .setPopup(
        new window.mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div><strong>${userName}</strong><br/>Vị trí hiện tại</div>`
        )
      )
      .addTo(map)
    
    return marker
  }
  
  // Thêm markers cho nearby users với avatar
  const addNearbyUserMarkers = (map, users) => {
    if (!map || !users || users.length === 0) return []
    
    // Xóa markers cũ
    clearMarkers()
    
    const newMarkers = []
    
    users.forEach(user => {
      // Tạo custom HTML element cho marker với avatar
      const markerElement = document.createElement('div')
      markerElement.className = 'custom-marker'
      markerElement.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #2563eb;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
      `
      
      if (user.avatar) {
        // Hiển thị avatar thật của user
        const avatarImg = document.createElement('img')
        avatarImg.src = user.avatar
        avatarImg.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
        `
        avatarImg.onerror = () => {
          // Fallback nếu avatar lỗi
          markerElement.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 600;
              font-size: 14px;
            ">${user.userName[0]?.toUpperCase() || 'U'}</div>
          `
        }
        markerElement.appendChild(avatarImg)
      } else {
        // Default avatar với initials
        markerElement.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
          ">${user.userName[0]?.toUpperCase() || 'U'}</div>
        `
      }
      
      const marker = new window.mapboxgl.Marker(markerElement)
        .setLngLat([user.longitude, user.latitude])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="text-align: center; min-width: 150px;">
              <img src="${user.avatar || '/src/assets/icons/profile.png'}" 
                   alt="${user.userName}" 
                   style="width: 50px; height: 50px; border-radius: 50%; margin-bottom: 8px; object-fit: cover;"
                   onerror="this.src='/src/assets/icons/profile.png'">
              <div><strong>${user.userName}</strong></div>
              <div style="color: #666; font-size: 12px; margin: 4px 0;">${user.distanceText}</div>
              ${user.bio ? `<div style="color: #666; font-size: 11px; margin-top: 4px; max-width: 140px; word-wrap: break-word;">${user.bio}</div>` : ''}
            </div>
          `)
        )
        .addTo(map)
      
      newMarkers.push(marker)
    })
    
    markers.value = newMarkers
    return newMarkers
  }
  
  // Xóa tất cả markers
  const clearMarkers = () => {
    markers.value.forEach(marker => marker.remove())
    markers.value = []
  }
  
  // Fit map bounds để hiển thị tất cả markers
  const fitMapBounds = (map, locations) => {
    if (!map || !locations || locations.length === 0) return
    
    const bounds = new window.mapboxgl.LngLatBounds()
    
    locations.forEach(location => {
      bounds.extend([location.longitude || location.lng, location.latitude || location.lat])
    })
    
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    })
  }
  
  // Chuyển đổi view mode
  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'map' ? 'list' : 'map'
  }
  
  // Reset tất cả state
  const resetLocationState = () => {
    currentLocation.value = null
    nearbyUsers.value = []
    errorMessage.value = ''
    permissionDenied.value = false
    clearMarkers()
    
    if (mapInstance.value) {
      mapInstance.value.remove()
      mapInstance.value = null
    }
  }
  
  return {
    // State
    currentLocation,
    nearbyUsers,
    isGettingLocation,
    isLoadingNearby,
    errorMessage,
    permissionDenied,
    viewMode,
    mapInstance,
    markers,
    
    // Geolocation functions
    getCurrentLocation,
    saveUserLocation,
    getNearbyUsers,
    removeUserLocation,
    
    // Map functions  
    initializeMap,
    addCurrentUserMarker,
    addNearbyUserMarkers,
    clearMarkers,
    fitMapBounds,
    
    // Utilities
    calculateDistance,
    formatDistance,
    toggleViewMode,
    resetLocationState,
    
    // Constants
    MAPBOX_ACCESS_TOKEN
  }
}