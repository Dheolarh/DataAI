// Location detection utility
export interface LocationData {
  country: string
  city: string
  region: string
  timezone: string
  ip: string
}

export const detectLocation = async (): Promise<LocationData> => {
  try {
    // Using ipapi.co for location detection (free tier)
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      timezone: data.timezone || 'UTC',
      ip: data.ip || 'Unknown'
    }
  } catch (error) {
    console.error('Location detection failed:', error)
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'UTC',
      ip: 'Unknown'
    }
  }
}

export const getCurrentUTCTime = (): string => {
  return new Date().toISOString()
}