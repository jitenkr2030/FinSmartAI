import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

interface MobileInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape' | undefined
}

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = React.useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: undefined
  })

  React.useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      const isMobile = width < MOBILE_BREAKPOINT
      const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
      const isDesktop = width >= TABLET_BREAKPOINT
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const orientation = width > height ? 'landscape' : height > width ? 'portrait' : undefined

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenWidth: width,
        screenHeight: height,
        orientation
      })
    }

    // Initial update
    updateDeviceInfo()

    // Listen for resize events
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      updateDeviceInfo()
    }
    
    mql.addEventListener("change", onChange)
    
    // Listen for orientation changes
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return mobileInfo
}

// Hook for touch-specific interactions
export function useTouchInteractions() {
  const [touchInfo, setTouchInfo] = React.useState({
    isSwiping: false,
    swipeDirection: '' as 'left' | 'right' | 'up' | 'down' | '',
    touchStart: { x: 0, y: 0 },
    touchEnd: { x: 0, y: 0 }
  })

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchInfo(prev => ({
      ...prev,
      touchStart: { x: touch.clientX, y: touch.clientY },
      touchEnd: { x: touch.clientX, y: touch.clientY }
    }))
  }, [])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!touchInfo.isSwiping) {
      const touch = e.touches[0]
      setTouchInfo(prev => ({
        ...prev,
        isSwiping: true,
        touchEnd: { x: touch.clientX, y: touch.clientY }
      }))
    } else {
      const touch = e.touches[0]
      setTouchInfo(prev => ({
        ...prev,
        touchEnd: { x: touch.clientX, y: touch.clientY }
      }))
    }
  }, [touchInfo.isSwiping])

  const handleTouchEnd = React.useCallback(() => {
    if (touchInfo.isSwiping) {
      const deltaX = touchInfo.touchEnd.x - touchInfo.touchStart.x
      const deltaY = touchInfo.touchEnd.y - touchInfo.touchStart.y
      const minSwipeDistance = 50

      let direction = ''
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          direction = deltaX > 0 ? 'right' : 'left'
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          direction = deltaY > 0 ? 'down' : 'up'
        }
      }

      setTouchInfo(prev => ({
        ...prev,
        isSwiping: false,
        swipeDirection: direction,
        touchStart: { x: 0, y: 0 },
        touchEnd: { x: 0, y: 0 }
      }))
    }
  }, [touchInfo])

  const resetSwipe = React.useCallback(() => {
    setTouchInfo(prev => ({
      ...prev,
      isSwiping: false,
      swipeDirection: '',
      touchStart: { x: 0, y: 0 },
      touchEnd: { x: 0, y: 0 }
    }))
  }, [])

  return {
    touchInfo,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetSwipe
  }
}

// Hook for responsive breakpoints
export function useBreakpoints() {
  const [breakpoints, setBreakpoints] = React.useState({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false
  })

  React.useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth
      setBreakpoints({
        xs: width >= 0 && width < 640,
        sm: width >= 640 && width < 768,
        md: width >= 768 && width < 1024,
        lg: width >= 1024 && width < 1280,
        xl: width >= 1280 && width < 1536,
        '2xl': width >= 1536
      })
    }

    updateBreakpoints()
    window.addEventListener('resize', updateBreakpoints)
    return () => window.removeEventListener('resize', updateBreakpoints)
  }, [])

  return breakpoints
}

// Legacy hook for backward compatibility
export function useIsMobile() {
  const mobileInfo = useMobile()
  return mobileInfo.isMobile
}
